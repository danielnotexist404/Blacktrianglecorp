from __future__ import annotations

from decimal import Decimal

from btg_strategy.types import LVN, Side


_HALF = Decimal("0.5")
_MIN_DIST_FRAC = Decimal("0.0015")  # 0.15% of entry price


def compute_stop_loss(
    entry_price: Decimal,
    lvn: LVN,
    side: Side,
    atr_14: Decimal,
) -> Decimal:
    """Compute the initial stop-loss price per the locked rule set.

    Base:
        Short  SL = lvn.high + 0.5 * atr_14
        Long   SL = lvn.low  - 0.5 * atr_14

    Minimum distance from entry (whichever is larger):
        max(0.5 * atr_14, 0.0015 * entry_price)

    If the base SL is closer to entry than the minimum distance, the SL is
    pushed further away so the minimum is satisfied. SL is always on the
    side of entry that means a losing trade if hit:
        - short: SL > entry
        - long:  SL < entry

    Args:
        entry_price: Fill price of the entry.
        lvn: The triggering LVN.
        side: Trade direction.
        atr_14: Wilder's ATR(14) on the trigger candle's close.

    Raises:
        ValueError: entry_price <= 0 or atr_14 <= 0.
    """
    if entry_price <= Decimal("0"):
        raise ValueError("entry_price must be > 0")
    if atr_14 <= Decimal("0"):
        raise ValueError("atr_14 must be > 0")

    min_distance = max(_HALF * atr_14, _MIN_DIST_FRAC * entry_price)

    if side == "short":
        base = lvn.high + _HALF * atr_14
        floor = entry_price + min_distance
        return max(base, floor)

    base = lvn.low - _HALF * atr_14
    ceiling = entry_price - min_distance
    return min(base, ceiling)
