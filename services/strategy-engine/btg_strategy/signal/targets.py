from __future__ import annotations

from decimal import Decimal
from typing import Sequence

from btg_strategy.types import LVN, Side, TPLabel, TPLeg, VolumeProfile


_ZERO = Decimal("0")


def build_tp_sequence(
    entry_price: Decimal,
    side: Side,
    profile: VolumeProfile,
    lvns: Sequence[LVN],
    triggering_lvn: LVN,
) -> list[TPLeg]:
    """Build the take-profit cascade per the locked rule set.

    Sequence intent (locked spec):
        closest LVN -> VAH -> POC -> VAL -> intermediate LVNs -> runner

    Implementation: collect all candidate price levels (profile lines + LVN
    edges) that lie strictly past entry in the trade direction, dedupe, and
    emit them in path order (descending price for short, ascending for long).
    The final leg is labeled 'runner' and sits at the far edge of the
    furthest LVN in path:
        - short: lowest LVN's low
        - long:  highest LVN's high
    Other LVNs contribute their *near* edge (resistance-becomes-support):
        - short: each LVN's high  (price falls to the top of the LVN)
        - long:  each LVN's low

    Args:
        entry_price: Fill price of the entry.
        side: Trade direction.
        profile: VolumeProfile carrying VAH/POC/VAL.
        lvns: All LVNs in the current profile (including the triggering one).
        triggering_lvn: The LVN whose rejection produced this signal.

    Returns:
        Ordered list of TPLeg. Empty when no LVN exists past entry in the
        trade direction — caller must reject the signal in that case.
    """
    # Filter to LVNs past entry, excluding the triggering one.
    if side == "short":
        path_lvns = [
            lvn for lvn in lvns
            if lvn.high < entry_price and not _same_lvn(lvn, triggering_lvn)
        ]
    else:
        path_lvns = [
            lvn for lvn in lvns
            if lvn.low > entry_price and not _same_lvn(lvn, triggering_lvn)
        ]

    if not path_lvns:
        return []

    # Sort path-LVNs by distance from entry, nearest first.
    if side == "short":
        path_lvns.sort(key=lambda l: l.high, reverse=True)
    else:
        path_lvns.sort(key=lambda l: l.low)

    candidates: list[tuple[Decimal, TPLabel]] = []

    # Profile lines that fall past entry.
    profile_levels: list[tuple[Decimal, TPLabel]] = [
        (profile.vah, "vah"),
        (profile.poc, "poc"),
        (profile.val, "val"),
    ]
    for price, label in profile_levels:
        if side == "short" and price < entry_price:
            candidates.append((price, label))
        elif side == "long" and price > entry_price:
            candidates.append((price, label))

    # Intermediate LVN near-edges (all but the far-side one).
    for lvn in path_lvns[:-1]:
        edge = lvn.high if side == "short" else lvn.low
        candidates.append((edge, "lvn"))

    # Runner: far edge of the furthest LVN.
    final_lvn = path_lvns[-1]
    runner_price = final_lvn.low if side == "short" else final_lvn.high
    candidates.append((runner_price, "runner"))

    # Sort in path order; dedupe by price (first-seen label wins).
    if side == "short":
        candidates.sort(key=lambda c: c[0], reverse=True)
    else:
        candidates.sort(key=lambda c: c[0])

    seen: set[Decimal] = set()
    legs: list[TPLeg] = []
    for price, label in candidates:
        if price in seen:
            continue
        seen.add(price)
        legs.append(TPLeg(price=price, label=label, leg_index=len(legs)))

    return legs


def compute_partial_weights(
    entry_price: Decimal,
    stop_loss: Decimal,
    tp_sequence: Sequence[TPLeg],
) -> list[Decimal]:
    """Distance-weighted partial sizing.

    For each TP leg:
        R_i = |TP_i.price - entry_price| / |entry_price - stop_loss|
        weight_i = R_i / sum_j(R_j)

    Naturally back-loads — the runner (furthest leg) gets the largest tranche
    because its R-distance dominates.

    Returns:
        Weights aligned to `tp_sequence`. sum(weights) == 1 within Decimal
        rounding. Empty when `tp_sequence` is empty.

    Raises:
        ValueError: entry == stop_loss (no defined R), or all TPs at entry.
    """
    if not tp_sequence:
        return []
    risk = abs(entry_price - stop_loss)
    if risk == _ZERO:
        raise ValueError("stop_loss must differ from entry_price")
    rs = [abs(leg.price - entry_price) / risk for leg in tp_sequence]
    total = sum(rs, _ZERO)
    if total == _ZERO:
        raise ValueError("all TPs sit at entry price; invalid sequence")
    return [r / total for r in rs]


def _same_lvn(a: LVN, b: LVN) -> bool:
    return a.low == b.low and a.high == b.high
