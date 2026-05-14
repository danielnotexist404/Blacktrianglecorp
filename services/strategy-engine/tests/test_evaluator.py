from __future__ import annotations

from decimal import Decimal

import pytest

from btg_strategy.signal.evaluator import evaluate_candle
from btg_strategy.types import (
    LVN,
    EvaluatorSettings,
    EvaluatorState,
)
from tests.conftest import make_candle


def _lvn(low: float, high: float, depth: float = 0.5, klass: str = "large") -> LVN:
    return LVN(
        low=Decimal(str(low)),
        high=Decimal(str(high)),
        depth=Decimal(str(depth)),
        classification=klass,  # type: ignore[arg-type]
    )


_SETTINGS_BOTH = EvaluatorSettings(focus_mode="both")
_SETTINGS_LARGE = EvaluatorSettings(focus_mode="large_only")
_SETTINGS_SMALL = EvaluatorSettings(focus_mode="small_only")
_ATR = Decimal("1.0")


# ----- no setup -----


def test_returns_none_when_candle_misses_all_lvns() -> None:
    lvn = _lvn(100, 102)
    candle = make_candle(95, 96, 94, 95.5, 10)
    state, setup = evaluate_candle(EvaluatorState(), candle, [lvn], _ATR, _SETTINGS_BOTH)
    assert setup is None
    assert state.test_order == ()


def test_no_wick_does_not_pollute_test_order() -> None:
    lvn = _lvn(100, 102)
    candle = make_candle(95, 99.5, 94, 96, 10)
    state, setup = evaluate_candle(EvaluatorState(), candle, [lvn], _ATR, _SETTINGS_BOTH)
    assert setup is None
    assert state.test_order == ()


# ----- short setup -----


def test_short_setup_confirms_when_close_below_lvn_low() -> None:
    lvn = _lvn(100, 102)
    # Open below LVN, wick into LVN, close back below.
    candle = make_candle(98, 101, 97.5, 99, 10)
    state, setup = evaluate_candle(EvaluatorState(), candle, [lvn], _ATR, _SETTINGS_BOTH)
    assert setup is not None
    assert setup.side == "short"
    assert setup.triggering_lvn == lvn
    assert state.test_order == (lvn,)


def test_short_setup_invalidates_when_close_inside_lvn() -> None:
    lvn = _lvn(100, 102)
    candle = make_candle(98, 101.5, 97.5, 101, 10)
    state, setup = evaluate_candle(EvaluatorState(), candle, [lvn], _ATR, _SETTINGS_BOTH)
    assert setup is None
    # LVN still gets recorded as tested.
    assert state.test_order == (lvn,)


def test_short_disqualified_when_open_already_inside_lvn() -> None:
    """A bar that opens inside the LVN didn't 'rally from below into' it."""
    lvn = _lvn(100, 102)
    candle = make_candle(101, 103, 99.5, 99, 10)
    state, setup = evaluate_candle(EvaluatorState(), candle, [lvn], _ATR, _SETTINGS_BOTH)
    assert setup is None
    assert state.test_order == ()


# ----- long setup -----


def test_long_setup_confirms_when_close_above_lvn_high() -> None:
    lvn = _lvn(100, 102)
    candle = make_candle(103, 104, 101, 103.5, 10)
    state, setup = evaluate_candle(EvaluatorState(), candle, [lvn], _ATR, _SETTINGS_BOTH)
    assert setup is not None
    assert setup.side == "long"
    assert setup.triggering_lvn == lvn
    assert state.test_order == (lvn,)


def test_long_setup_invalidates_when_close_inside_lvn() -> None:
    lvn = _lvn(100, 102)
    candle = make_candle(103, 104, 100.5, 101, 10)
    state, setup = evaluate_candle(EvaluatorState(), candle, [lvn], _ATR, _SETTINGS_BOTH)
    assert setup is None
    assert state.test_order == (lvn,)


# ----- two-bar mode -----


def test_two_bar_confirmation_raises_not_implemented() -> None:
    lvn = _lvn(100, 102)
    candle = make_candle(98, 101, 97.5, 99, 10)
    settings = EvaluatorSettings(focus_mode="both", two_bar_confirmation=True)
    with pytest.raises(NotImplementedError, match="single-bar"):
        evaluate_candle(EvaluatorState(), candle, [lvn], _ATR, settings)


# ----- input validation -----


def test_zero_atr_rejected() -> None:
    lvn = _lvn(100, 102)
    candle = make_candle(98, 101, 97.5, 99, 10)
    with pytest.raises(ValueError, match="atr_14"):
        evaluate_candle(EvaluatorState(), candle, [lvn], Decimal("0"), _SETTINGS_BOTH)


def test_negative_atr_rejected() -> None:
    lvn = _lvn(100, 102)
    candle = make_candle(98, 101, 97.5, 99, 10)
    with pytest.raises(ValueError, match="atr_14"):
        evaluate_candle(
            EvaluatorState(), candle, [lvn], Decimal("-0.5"), _SETTINGS_BOTH
        )


# ----- cluster + focus_mode -----


def test_large_only_filters_out_small_cluster() -> None:
    # Two adjacent small LVNs, both wicked. Cluster proximity 0.5 * ATR.
    small_a = _lvn(100, 100.5, depth=0.2, klass="small")
    small_b = _lvn(100.6, 101.1, depth=0.25, klass="small")
    candle = make_candle(99, 101, 98.5, 99.5, 10)
    state, setup = evaluate_candle(
        EvaluatorState(), candle, [small_a, small_b], _ATR, _SETTINGS_LARGE
    )
    assert setup is None
    # test_order still updated — the LVNs were wicked.
    assert len(state.test_order) == 2


def test_large_only_picks_deepest_from_mixed_cluster() -> None:
    big = _lvn(100, 100.4, depth=0.8, klass="large")
    bigger = _lvn(100.5, 101.0, depth=0.95, klass="large")
    small = _lvn(101.1, 101.4, depth=0.3, klass="small")
    candle = make_candle(99, 101.5, 98.5, 99.5, 10)
    state, setup = evaluate_candle(
        EvaluatorState(), candle, [big, bigger, small], _ATR, _SETTINGS_LARGE
    )
    assert setup is not None
    assert setup.triggering_lvn == bigger  # deepest large


def test_small_only_picks_shallowest_small() -> None:
    big = _lvn(100, 100.4, depth=0.9, klass="large")
    small_a = _lvn(100.5, 100.7, depth=0.4, klass="small")
    small_b = _lvn(100.8, 101.0, depth=0.2, klass="small")
    candle = make_candle(99, 101.2, 98.5, 99.5, 10)
    state, setup = evaluate_candle(
        EvaluatorState(), candle, [big, small_a, small_b], _ATR, _SETTINGS_SMALL
    )
    assert setup is not None
    assert setup.triggering_lvn == small_b  # shallowest small


def test_both_mode_uses_test_order_to_select() -> None:
    # Two LVNs in a cluster; pre-seed test_order so the second one is "earlier".
    lvn_a = _lvn(100, 100.4)
    lvn_b = _lvn(100.5, 101.0)
    pre_state = EvaluatorState(test_order=(lvn_b, lvn_a))
    candle = make_candle(99, 101.2, 98.5, 99.5, 10)
    state, setup = evaluate_candle(
        pre_state, candle, [lvn_a, lvn_b], _ATR, _SETTINGS_BOTH
    )
    assert setup is not None
    assert setup.triggering_lvn == lvn_b  # first in test_order
    # test_order unchanged because both LVNs were already in it.
    assert state.test_order == (lvn_b, lvn_a)


def test_far_apart_lvns_do_not_cluster() -> None:
    """Gap > 0.5*ATR keeps them as independent clusters."""
    a = _lvn(100, 100.4, depth=0.2, klass="small")
    b = _lvn(102, 102.4, depth=0.9, klass="large")
    # Candle wicks into 'a' only.
    candle = make_candle(99, 100.2, 98.5, 99.5, 10)
    state, setup = evaluate_candle(EvaluatorState(), candle, [a, b], _ATR, _SETTINGS_LARGE)
    # 'a' is small + large_only -> filtered out. 'b' wasn't wicked. No setup.
    assert setup is None
    assert state.test_order == (a,)


# ----- test_order grows across calls -----


def test_test_order_accumulates_across_calls() -> None:
    lvn_a = _lvn(100, 101)
    lvn_b = _lvn(110, 111)
    # Candle 1 wicks lvn_a but closes inside (invalidated).
    c1 = make_candle(98, 100.5, 97, 100.5, 10)
    state, setup1 = evaluate_candle(
        EvaluatorState(), c1, [lvn_a, lvn_b], _ATR, _SETTINGS_BOTH
    )
    assert setup1 is None
    assert state.test_order == (lvn_a,)
    # Candle 2 wicks lvn_b and confirms.
    c2 = make_candle(108, 110.5, 107, 109.5, 10)
    state2, setup2 = evaluate_candle(state, c2, [lvn_a, lvn_b], _ATR, _SETTINGS_BOTH)
    assert setup2 is not None
    assert setup2.triggering_lvn == lvn_b
    assert state2.test_order == (lvn_a, lvn_b)


def test_test_order_does_not_duplicate_repeated_wicks() -> None:
    lvn = _lvn(100, 101)
    c1 = make_candle(98, 100.5, 97, 100.5, 10)  # invalidated
    state, _ = evaluate_candle(EvaluatorState(), c1, [lvn], _ATR, _SETTINGS_BOTH)
    c2 = make_candle(98, 100.5, 97, 100.5, 10)  # same shape, still invalidated
    state2, _ = evaluate_candle(state, c2, [lvn], _ATR, _SETTINGS_BOTH)
    assert state2.test_order == (lvn,)


# ----- double-sided rare case -----


def test_double_sided_candle_picks_deeper_rejection() -> None:
    # short LVN above open, long LVN below open. Huge-range candle wicks both
    # and closes outside both. Closer side wins by larger close-vs-edge gap.
    lvn_short = _lvn(110, 112)
    lvn_long = _lvn(90, 92)
    # open=100; close=95 -> short-side close distance = 110-95=15;
    #                       long-side close distance  = 95-92=3.
    candle = make_candle(100, 113, 89, 95, 10)
    state, setup = evaluate_candle(
        EvaluatorState(), candle, [lvn_short, lvn_long], _ATR, _SETTINGS_BOTH
    )
    assert setup is not None
    assert setup.side == "short"
    assert setup.triggering_lvn == lvn_short
    # Both LVNs wicked -> both in test_order.
    assert set(state.test_order) == {lvn_short, lvn_long}
