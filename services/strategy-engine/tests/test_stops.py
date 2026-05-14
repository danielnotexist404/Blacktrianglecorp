from __future__ import annotations

from decimal import Decimal

import pytest
from hypothesis import HealthCheck, given, settings, strategies as st

from btg_strategy.signal.stops import compute_stop_loss
from btg_strategy.types import LVN, Side


def _lvn(low: float, high: float) -> LVN:
    return LVN(
        low=Decimal(str(low)),
        high=Decimal(str(high)),
        depth=Decimal("0.5"),
        classification="large",
    )


# ----- input validation -----


def test_rejects_non_positive_entry() -> None:
    with pytest.raises(ValueError):
        compute_stop_loss(Decimal("0"), _lvn(100, 102), "short", Decimal("1"))


def test_rejects_non_positive_atr() -> None:
    with pytest.raises(ValueError):
        compute_stop_loss(Decimal("100"), _lvn(100, 102), "short", Decimal("0"))


# ----- short side -----


def test_short_sl_at_lvn_high_plus_half_atr() -> None:
    sl = compute_stop_loss(
        entry_price=Decimal("99"),
        lvn=_lvn(100, 102),
        side="short",
        atr_14=Decimal("4"),
    )
    # base = 102 + 2 = 104.
    # min_dist = max(2, 0.0015 * 99) = max(2, 0.1485) = 2.
    # floor = 99 + 2 = 101. base (104) >= floor → SL = 104.
    assert sl == Decimal("104")


def test_short_sl_pushed_to_min_distance_when_lvn_tight_to_entry() -> None:
    sl = compute_stop_loss(
        entry_price=Decimal("99.9"),
        lvn=_lvn(100, 100.05),
        side="short",
        atr_14=Decimal("4"),
    )
    # base = 100.05 + 2 = 102.05.
    # min_dist = max(2, 0.0015 * 99.9) = max(2, 0.14985) = 2.
    # floor = 99.9 + 2 = 101.9. base (102.05) >= floor → SL = 102.05.
    assert sl == Decimal("102.05")


def test_short_sl_uses_pct_floor_when_atr_floor_smaller() -> None:
    # atr_14 = 0.001 → 0.5*atr = 0.0005.
    # entry = 1000 → 0.0015*entry = 1.5. Pct floor dominates.
    sl = compute_stop_loss(
        entry_price=Decimal("1000"),
        lvn=_lvn(1000.1, 1000.2),
        side="short",
        atr_14=Decimal("0.001"),
    )
    # base = 1000.2 + 0.0005 = 1000.2005.
    # min_dist = max(0.0005, 1.5) = 1.5.
    # floor = 1000 + 1.5 = 1001.5. SL = max(base, floor) = 1001.5.
    assert sl == Decimal("1001.5")


# ----- long side -----


def test_long_sl_at_lvn_low_minus_half_atr() -> None:
    sl = compute_stop_loss(
        entry_price=Decimal("103"),
        lvn=_lvn(100, 102),
        side="long",
        atr_14=Decimal("4"),
    )
    # base = 100 - 2 = 98. min_dist = max(2, 0.0015 * 103) = 2.
    # ceiling = 103 - 2 = 101. SL = min(base, ceiling) = 98.
    assert sl == Decimal("98")


def test_long_sl_pulled_to_min_distance_when_lvn_tight_to_entry() -> None:
    sl = compute_stop_loss(
        entry_price=Decimal("102.1"),
        lvn=_lvn(101.95, 102),
        side="long",
        atr_14=Decimal("4"),
    )
    # base = 101.95 - 2 = 99.95. min_dist = max(2, 0.0015 * 102.1) = 2.
    # ceiling = 102.1 - 2 = 100.1. SL = min(base=99.95, ceiling=100.1) = 99.95.
    assert sl == Decimal("99.95")


# ----- hypothesis -----


@given(
    entry=st.decimals(min_value=Decimal("1"), max_value=Decimal("100000"),
                     allow_nan=False, allow_infinity=False, places=2),
    lvn_low=st.decimals(min_value=Decimal("1"), max_value=Decimal("100000"),
                       allow_nan=False, allow_infinity=False, places=2),
    lvn_height=st.decimals(min_value=Decimal("0.01"), max_value=Decimal("50"),
                          allow_nan=False, allow_infinity=False, places=2),
    atr=st.decimals(min_value=Decimal("0.01"), max_value=Decimal("1000"),
                   allow_nan=False, allow_infinity=False, places=2),
    side=st.sampled_from(["short", "long"]),
)
@settings(max_examples=300, deadline=None, suppress_health_check=[HealthCheck.too_slow])
def test_property_sl_is_on_correct_side_of_entry(
    entry: Decimal,
    lvn_low: Decimal,
    lvn_height: Decimal,
    atr: Decimal,
    side: Side,
) -> None:
    lvn = LVN(
        low=lvn_low,
        high=lvn_low + lvn_height,
        depth=Decimal("0.5"),
        classification="large",
    )
    sl = compute_stop_loss(entry, lvn, side, atr)
    if side == "short":
        assert sl > entry
    else:
        assert sl < entry


@given(
    entry=st.decimals(min_value=Decimal("1"), max_value=Decimal("100000"),
                     allow_nan=False, allow_infinity=False, places=2),
    lvn_low=st.decimals(min_value=Decimal("1"), max_value=Decimal("100000"),
                       allow_nan=False, allow_infinity=False, places=2),
    lvn_height=st.decimals(min_value=Decimal("0.01"), max_value=Decimal("50"),
                          allow_nan=False, allow_infinity=False, places=2),
    atr=st.decimals(min_value=Decimal("0.01"), max_value=Decimal("1000"),
                   allow_nan=False, allow_infinity=False, places=2),
    side=st.sampled_from(["short", "long"]),
)
@settings(max_examples=300, deadline=None, suppress_health_check=[HealthCheck.too_slow])
def test_property_sl_distance_satisfies_floor(
    entry: Decimal,
    lvn_low: Decimal,
    lvn_height: Decimal,
    atr: Decimal,
    side: Side,
) -> None:
    lvn = LVN(
        low=lvn_low,
        high=lvn_low + lvn_height,
        depth=Decimal("0.5"),
        classification="large",
    )
    sl = compute_stop_loss(entry, lvn, side, atr)
    min_dist = max(Decimal("0.5") * atr, Decimal("0.0015") * entry)
    assert abs(sl - entry) >= min_dist
