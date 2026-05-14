from __future__ import annotations

from datetime import datetime
from decimal import Decimal

import pytest

from btg_strategy.signal.trigger import detect_rejection_close, detect_wick_into_lvn
from btg_strategy.types import LVN
from tests.conftest import make_candle


def _lvn(low: float, high: float) -> LVN:
    return LVN(
        low=Decimal(str(low)),
        high=Decimal(str(high)),
        depth=Decimal("0.5"),
        classification="large",
    )


# ----- detect_wick_into_lvn -----


def test_short_wick_qualifies_when_high_at_or_above_lvn_low() -> None:
    lvn = _lvn(100, 102)
    assert detect_wick_into_lvn(make_candle(99, 101, 98, 99, 10), lvn, "short") is True
    # Exactly at the boundary qualifies.
    assert detect_wick_into_lvn(make_candle(99, 100, 98, 99, 10), lvn, "short") is True


def test_short_wick_disqualifies_when_high_below_lvn_low() -> None:
    lvn = _lvn(100, 102)
    assert detect_wick_into_lvn(make_candle(99, 99.9, 98, 99, 10), lvn, "short") is False


def test_long_wick_qualifies_when_low_at_or_below_lvn_high() -> None:
    lvn = _lvn(100, 102)
    assert detect_wick_into_lvn(make_candle(103, 104, 102, 103, 10), lvn, "long") is True
    assert detect_wick_into_lvn(make_candle(103, 104, 101, 103, 10), lvn, "long") is True


def test_long_wick_disqualifies_when_low_above_lvn_high() -> None:
    lvn = _lvn(100, 102)
    assert (
        detect_wick_into_lvn(make_candle(103, 104, 102.1, 103, 10), lvn, "long") is False
    )


# ----- detect_rejection_close -----


def test_short_confirmed_when_close_below_lvn_low() -> None:
    lvn = _lvn(100, 102)
    candle = make_candle(101, 101.5, 98, 99.5, 10)
    assert detect_rejection_close(candle, lvn, "short") == "confirmed"


def test_short_invalidated_when_close_at_lvn_low() -> None:
    lvn = _lvn(100, 102)
    candle = make_candle(99, 101, 98, 100, 10)
    assert detect_rejection_close(candle, lvn, "short") == "invalidated"


def test_short_invalidated_when_close_inside_lvn() -> None:
    lvn = _lvn(100, 102)
    candle = make_candle(99, 102, 98, 101, 10)
    assert detect_rejection_close(candle, lvn, "short") == "invalidated"


def test_long_confirmed_when_close_above_lvn_high() -> None:
    lvn = _lvn(100, 102)
    candle = make_candle(101, 103.5, 100, 102.5, 10)
    assert detect_rejection_close(candle, lvn, "long") == "confirmed"


def test_long_invalidated_when_close_at_lvn_high() -> None:
    lvn = _lvn(100, 102)
    candle = make_candle(101, 103, 100, 102, 10)
    assert detect_rejection_close(candle, lvn, "long") == "invalidated"
