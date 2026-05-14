from __future__ import annotations

from datetime import datetime, timedelta
from decimal import Decimal

import pytest
from hypothesis import HealthCheck, given, settings, strategies as st

from btg_strategy.profile.volume_profile import build_volume_profile
from btg_strategy.types import Candle
from tests.conftest import make_candle


# ----- input validation -----


def test_rejects_empty_candles() -> None:
    with pytest.raises(ValueError, match="non-empty"):
        build_volume_profile([])


def test_rejects_row_count_below_two() -> None:
    c = make_candle(100, 101, 99, 100, 1)
    with pytest.raises(ValueError, match=">= 2"):
        build_volume_profile([c], row_count=1)


def test_rejects_va_pct_outside_range() -> None:
    c = make_candle(100, 101, 99, 100, 1)
    with pytest.raises(ValueError):
        build_volume_profile([c], va_pct=Decimal("0"))
    with pytest.raises(ValueError):
        build_volume_profile([c], va_pct=Decimal("1.01"))


# ----- shape and basic math -----


def test_single_candle_profile_shape() -> None:
    c = make_candle(100, 110, 90, 105, 1000)
    p = build_volume_profile([c], row_count=10)
    assert p.profile_low == Decimal("90")
    assert p.profile_high == Decimal("110")
    assert p.row_step == Decimal("2")
    assert p.row_count == 10
    assert len(p.row_volume) == 10
    assert sum(p.row_volume, Decimal("0")) == Decimal("1000")


def test_two_identical_candles_doubles_total_volume() -> None:
    c1 = make_candle(100, 110, 90, 105, 1000, t=datetime(2024, 1, 1, 0))
    c2 = make_candle(100, 110, 90, 105, 1000, t=datetime(2024, 1, 1, 1))
    p = build_volume_profile([c1, c2], row_count=10)
    assert sum(p.row_volume, Decimal("0")) == Decimal("2000")


def test_poc_is_in_profile_range() -> None:
    c = make_candle(100, 110, 90, 105, 1000)
    p = build_volume_profile([c], row_count=10)
    assert p.profile_low <= p.poc <= p.profile_high


def _hourly(i: int) -> datetime:
    return datetime(2024, 1, 1) + timedelta(hours=i)


def test_value_area_contains_poc() -> None:
    candles = [
        make_candle(100, 110, 90, 105, 100, t=_hourly(h)) for h in range(50)
    ]
    p = build_volume_profile(candles, row_count=20, va_pct=Decimal("0.68"))
    assert p.val <= p.poc <= p.vah


def test_value_area_captures_at_least_va_pct() -> None:
    candles = [
        make_candle(100, 110, 90, 105, 100, t=_hourly(h)) for h in range(50)
    ]
    p = build_volume_profile(candles, row_count=20, va_pct=Decimal("0.68"))

    total = sum(p.row_volume, Decimal("0"))
    lower_idx = int((p.val - p.profile_low) / p.row_step)
    upper_idx = int((p.vah - p.profile_low) / p.row_step) - 1
    va_volume = sum(p.row_volume[lower_idx : upper_idx + 1], Decimal("0"))
    assert va_volume / total >= Decimal("0.68")


# ----- polarity behaviour -----


def test_polarity_bar_classifies_close_above_open_as_up() -> None:
    c = make_candle(100, 110, 99, 100.5, 1000)
    p = build_volume_profile([c], row_count=10, polarity_method="bar")
    assert sum(p.row_up_volume, Decimal("0")) == Decimal("1000")


def test_polarity_pressure_classifies_by_wick_balance() -> None:
    # close (100.5) is much closer to low (99) than to high (110):
    # (close-low)=1.5  vs  (high-close)=9.5  →  classified as down.
    c = make_candle(100, 110, 99, 100.5, 1000)
    p = build_volume_profile([c], row_count=10, polarity_method="pressure")
    assert sum(p.row_up_volume, Decimal("0")) == Decimal("0")


def test_polarity_does_not_affect_total_row_volume() -> None:
    candles = [
        make_candle(100, 110, 95, 102, 100, t=_hourly(h)) for h in range(20)
    ]
    p_bar = build_volume_profile(candles, row_count=20, polarity_method="bar")
    p_press = build_volume_profile(candles, row_count=20, polarity_method="pressure")
    assert p_bar.row_volume == p_press.row_volume
    assert p_bar.poc == p_press.poc
    assert p_bar.vah == p_press.vah
    assert p_bar.val == p_press.val


# ----- hypothesis property tests -----

_PRICE = st.decimals(
    min_value=Decimal("0.01"),
    max_value=Decimal("100000"),
    allow_nan=False,
    allow_infinity=False,
    places=2,
)
_VOLUME = st.decimals(
    min_value=Decimal("0"),
    max_value=Decimal("1000000"),
    allow_nan=False,
    allow_infinity=False,
    places=4,
)
_RANGE = st.decimals(
    min_value=Decimal("0"),
    max_value=Decimal("100"),
    allow_nan=False,
    allow_infinity=False,
    places=2,
)


@st.composite
def _candle_strat(draw: st.DrawFn) -> Candle:
    low = draw(_PRICE)
    span = draw(_RANGE)
    high = low + span
    open_p = draw(
        st.decimals(
            min_value=low, max_value=high, allow_nan=False, allow_infinity=False, places=2
        )
    )
    close = draw(
        st.decimals(
            min_value=low, max_value=high, allow_nan=False, allow_infinity=False, places=2
        )
    )
    volume = draw(_VOLUME)
    return Candle(
        open_time=datetime(2024, 1, 1),
        close_time=datetime(2024, 1, 1, 1),
        open=open_p,
        high=high,
        low=low,
        close=close,
        volume=volume,
    )


@given(candles=st.lists(_candle_strat(), min_size=1, max_size=80))
@settings(max_examples=150, deadline=None, suppress_health_check=[HealthCheck.too_slow])
def test_property_volume_is_conserved(candles: list[Candle]) -> None:
    p = build_volume_profile(candles, row_count=30)
    total_in = sum((c.volume for c in candles), Decimal("0"))
    total_profile = sum(p.row_volume, Decimal("0"))
    # Tiny rounding allowed due to Decimal division
    assert abs(total_in - total_profile) < Decimal("0.001")


@given(candles=st.lists(_candle_strat(), min_size=1, max_size=80))
@settings(max_examples=100, deadline=None, suppress_health_check=[HealthCheck.too_slow])
def test_property_value_area_bounds(candles: list[Candle]) -> None:
    p = build_volume_profile(candles, row_count=30)
    assert p.profile_low <= p.val
    assert p.val <= p.poc
    assert p.poc <= p.vah
    assert p.vah <= p.profile_high


@given(
    candles=st.lists(_candle_strat(), min_size=1, max_size=40),
    shift=st.decimals(
        min_value=Decimal("0"),
        max_value=Decimal("10000"),
        allow_nan=False,
        allow_infinity=False,
        places=2,
    ),
)
@settings(max_examples=40, deadline=None, suppress_health_check=[HealthCheck.too_slow])
def test_property_translation_invariance(
    candles: list[Candle], shift: Decimal
) -> None:
    """Shifting every price by the same constant should shift POC/VAH/VAL by
    that constant and leave row_volume invariant."""
    shifted = [
        Candle(
            open_time=c.open_time,
            close_time=c.close_time,
            open=c.open + shift,
            high=c.high + shift,
            low=c.low + shift,
            close=c.close + shift,
            volume=c.volume,
        )
        for c in candles
    ]
    p1 = build_volume_profile(candles, row_count=25)
    p2 = build_volume_profile(shifted, row_count=25)
    assert p2.poc - p1.poc == shift
    assert p2.vah - p1.vah == shift
    assert p2.val - p1.val == shift
    assert p2.row_volume == p1.row_volume
