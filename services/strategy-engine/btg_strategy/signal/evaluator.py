from __future__ import annotations

from decimal import Decimal
from typing import Optional, Sequence

from btg_strategy.signal.cluster import resolve_lvn_cluster
from btg_strategy.signal.trigger import detect_rejection_close
from btg_strategy.types import (
    LVN,
    Candle,
    EvaluatorSettings,
    EvaluatorState,
    Setup,
    Side,
)


_ZERO = Decimal("0")


def evaluate_candle(
    state: EvaluatorState,
    candle: Candle,
    lvns: Sequence[LVN],
    atr_14: Decimal,
    settings: EvaluatorSettings,
) -> tuple[EvaluatorState, Optional[Setup]]:
    """Single-bar setup detector. Pure function: state in, state out.

    Algorithm:
        1. For each LVN in `lvns`, classify whether this candle wicks into it
           from a valid rally direction:
             short candidate -> candle.open < lvn.low  AND  candle.high >= lvn.low
             long  candidate -> candle.open > lvn.high AND  candle.low  <= lvn.high
        2. Append every newly-wicked LVN (not already in test_order) to a new
           test_order tuple — that history feeds resolve_lvn_cluster's 'both'
           mode and is preserved across calls.
        3. Bundle wicked LVNs per side into clusters whose member-to-member
           edge gap is <= settings.cluster_atr_factor * atr_14.
        4. resolve_lvn_cluster picks one LVN per cluster per focus_mode.
        5. Classify the candle's close against each picked LVN. Emit Setup on
           the first 'confirmed' rejection. If both sides confirm on the same
           candle (rare — requires LVNs on both sides of open), pick the side
           whose close sits further past the LVN edge.

    The setup's entry fires at the *next* bar's open; the execution layer owns
    that. This function only identifies that a confirmed rejection occurred.

    Args:
        state: Carry-over state. EvaluatorState() for a fresh series.
        candle: The just-closed H1 candle to evaluate.
        lvns: Active (non-dormant) LVNs from the current profile.
        atr_14: Wilder ATR(14) at this candle's close — used for clustering.
        settings: focus_mode + cluster_atr_factor + two_bar_confirmation.

    Returns:
        (new_state, Setup | None).

    Raises:
        NotImplementedError: settings.two_bar_confirmation=True. Two-bar mode
            is in the locked spec but its exact semantics are undefined; v1
            implements single-bar only.
        ValueError: atr_14 <= 0.
    """
    if settings.two_bar_confirmation:
        raise NotImplementedError(
            "two_bar_confirmation: locked spec section 3.4 leaves the precise "
            "semantics undefined; only single-bar mode is implemented in v1"
        )
    if atr_14 <= _ZERO:
        raise ValueError("atr_14 must be > 0")

    short_wicks: list[LVN] = []
    long_wicks: list[LVN] = []
    for lvn in lvns:
        if candle.open < lvn.low and candle.high >= lvn.low:
            short_wicks.append(lvn)
        elif candle.open > lvn.high and candle.low <= lvn.high:
            long_wicks.append(lvn)

    new_state = _extend_test_order(state, short_wicks + long_wicks)

    if not short_wicks and not long_wicks:
        return new_state, None

    proximity = settings.cluster_atr_factor * atr_14

    short_setup = _resolve_side(
        candle, short_wicks, "short", proximity, settings, new_state
    )
    long_setup = _resolve_side(
        candle, long_wicks, "long", proximity, settings, new_state
    )

    if short_setup is not None and long_setup is not None:
        short_dist = short_setup.triggering_lvn.low - candle.close
        long_dist = candle.close - long_setup.triggering_lvn.high
        return new_state, short_setup if short_dist >= long_dist else long_setup

    return new_state, short_setup or long_setup


def _resolve_side(
    candle: Candle,
    wicks: list[LVN],
    side: Side,
    proximity: Decimal,
    settings: EvaluatorSettings,
    new_state: EvaluatorState,
) -> Optional[Setup]:
    if not wicks:
        return None
    for cluster in _bundle_clusters(wicks, proximity):
        picked = resolve_lvn_cluster(cluster, settings.focus_mode, new_state.test_order)
        if picked is None:
            continue
        if detect_rejection_close(candle, picked, side) == "confirmed":
            return Setup(side=side, triggering_lvn=picked, trigger_candle=candle)
    return None


def _bundle_clusters(lvns: list[LVN], proximity: Decimal) -> list[list[LVN]]:
    """Group LVNs whose edge-to-edge gap is <= `proximity`.

    Sort ascending by `low`; an LVN joins the previous cluster when its `low`
    minus the cluster's running max-high is <= proximity. Touching LVNs
    (gap == 0) merge.
    """
    if not lvns:
        return []
    sorted_lvns = sorted(lvns, key=lambda lvn: lvn.low)
    clusters: list[list[LVN]] = [[sorted_lvns[0]]]
    running_high = sorted_lvns[0].high
    for lvn in sorted_lvns[1:]:
        if lvn.low - running_high <= proximity:
            clusters[-1].append(lvn)
            if lvn.high > running_high:
                running_high = lvn.high
        else:
            clusters.append([lvn])
            running_high = lvn.high
    return clusters


def _extend_test_order(state: EvaluatorState, wicked: list[LVN]) -> EvaluatorState:
    if not wicked:
        return state
    seen = {(lvn.low, lvn.high) for lvn in state.test_order}
    additions: list[LVN] = []
    for lvn in wicked:
        key = (lvn.low, lvn.high)
        if key not in seen:
            seen.add(key)
            additions.append(lvn)
    if not additions:
        return state
    return EvaluatorState(test_order=state.test_order + tuple(additions))
