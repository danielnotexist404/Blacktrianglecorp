from __future__ import annotations

from decimal import Decimal

import pytest
from hypothesis import HealthCheck, given, settings, strategies as st

from btg_strategy.signal.targets import build_tp_sequence, compute_partial_weights
from btg_strategy.types import LVN, TPLeg, VolumeProfile


def _profile(
    poc: float, vah: float, val: float, p_low: float, p_high: float
) -> VolumeProfile:
    return VolumeProfile(
        poc=Decimal(str(poc)),
        vah=Decimal(str(vah)),
        val=Decimal(str(val)),
        profile_high=Decimal(str(p_high)),
        profile_low=Decimal(str(p_low)),
        row_step=Decimal("1"),
        row_count=100,
        row_volume=tuple([Decimal("0")] * 100),
        row_up_volume=tuple([Decimal("0")] * 100),
        polarity_method="bar",
    )


def _lvn(low: float, high: float) -> LVN:
    return LVN(
        low=Decimal(str(low)),
        high=Decimal(str(high)),
        depth=Decimal("0.5"),
        classification="large",
    )


# ----- build_tp_sequence: short -----


def test_short_tp_sequence_orders_descending() -> None:
    trig = _lvn(105, 106)
    far = _lvn(90, 91)
    mid = _lvn(96, 97)
    profile = _profile(poc=98, vah=100, val=95, p_low=80, p_high=110)
    legs = build_tp_sequence(
        entry_price=Decimal("104.5"),
        side="short",
        profile=profile,
        lvns=[trig, far, mid],
        triggering_lvn=trig,
    )
    prices = [leg.price for leg in legs]
    # Strictly descending in path order for shorts.
    assert prices == sorted(prices, reverse=True)
    # Final leg is the runner at far_lvn.low.
    assert legs[-1].label == "runner"
    assert legs[-1].price == Decimal("90")
    # Intermediate LVN contributes its upper edge.
    assert any(leg.price == Decimal("97") and leg.label == "lvn" for leg in legs)


def test_short_skips_profile_lines_above_entry() -> None:
    trig = _lvn(105, 106)
    far = _lvn(90, 91)
    profile = _profile(poc=98, vah=108, val=95, p_low=80, p_high=110)
    legs = build_tp_sequence(
        entry_price=Decimal("104.5"),
        side="short",
        profile=profile,
        lvns=[trig, far],
        triggering_lvn=trig,
    )
    # VAH (108) is above entry; must not appear.
    assert not any(leg.label == "vah" for leg in legs)


def test_short_empty_when_no_lvn_in_path() -> None:
    trig = _lvn(105, 106)
    profile = _profile(poc=98, vah=100, val=95, p_low=80, p_high=110)
    legs = build_tp_sequence(
        entry_price=Decimal("104.5"),
        side="short",
        profile=profile,
        lvns=[trig],  # only the trigger; nothing past entry.
        triggering_lvn=trig,
    )
    assert legs == []


# ----- build_tp_sequence: long -----


def test_long_tp_sequence_orders_ascending() -> None:
    trig = _lvn(80, 81)
    far = _lvn(105, 106)
    mid = _lvn(95, 96)
    profile = _profile(poc=92, vah=100, val=88, p_low=70, p_high=110)
    legs = build_tp_sequence(
        entry_price=Decimal("82"),
        side="long",
        profile=profile,
        lvns=[trig, far, mid],
        triggering_lvn=trig,
    )
    prices = [leg.price for leg in legs]
    assert prices == sorted(prices)
    assert legs[-1].label == "runner"
    assert legs[-1].price == Decimal("106")
    assert any(leg.price == Decimal("95") and leg.label == "lvn" for leg in legs)


# ----- compute_partial_weights -----


def test_weights_sum_to_one() -> None:
    legs = [
        TPLeg(price=Decimal("100"), label="vah", leg_index=0),
        TPLeg(price=Decimal("98"), label="poc", leg_index=1),
        TPLeg(price=Decimal("95"), label="val", leg_index=2),
        TPLeg(price=Decimal("90"), label="runner", leg_index=3),
    ]
    weights = compute_partial_weights(
        entry_price=Decimal("104.5"),
        stop_loss=Decimal("107"),
        tp_sequence=legs,
    )
    total = sum(weights, Decimal("0"))
    assert abs(total - Decimal("1")) < Decimal("1e-25")


def test_weights_are_back_loaded() -> None:
    legs = [
        TPLeg(price=Decimal("100"), label="vah", leg_index=0),
        TPLeg(price=Decimal("90"), label="runner", leg_index=1),
    ]
    weights = compute_partial_weights(
        entry_price=Decimal("104.5"),
        stop_loss=Decimal("107"),
        tp_sequence=legs,
    )
    # The runner is farther from entry → must get the larger weight.
    assert weights[1] > weights[0]


def test_empty_tp_sequence_yields_empty_weights() -> None:
    assert compute_partial_weights(Decimal("100"), Decimal("102"), []) == []


def test_zero_risk_raises() -> None:
    legs = [TPLeg(price=Decimal("90"), label="runner", leg_index=0)]
    with pytest.raises(ValueError, match="differ"):
        compute_partial_weights(Decimal("100"), Decimal("100"), legs)


# ----- hypothesis -----


@given(
    entry=st.decimals(min_value=Decimal("100"), max_value=Decimal("10000"),
                     allow_nan=False, allow_infinity=False, places=2),
    risk=st.decimals(min_value=Decimal("0.5"), max_value=Decimal("50"),
                    allow_nan=False, allow_infinity=False, places=2),
    distances=st.lists(
        st.decimals(min_value=Decimal("0.01"), max_value=Decimal("500"),
                   allow_nan=False, allow_infinity=False, places=2),
        min_size=1,
        max_size=8,
        unique=True,
    ),
)
@settings(max_examples=200, deadline=None, suppress_health_check=[HealthCheck.too_slow])
def test_property_weights_sum_to_one_and_are_non_negative(
    entry: Decimal,
    risk: Decimal,
    distances: list[Decimal],
) -> None:
    # Short setup: TPs below entry.
    distances_sorted = sorted(distances)
    legs = [
        TPLeg(price=entry - d, label="lvn", leg_index=i)
        for i, d in enumerate(distances_sorted)
    ]
    sl = entry + risk
    weights = compute_partial_weights(entry, sl, legs)
    for w in weights:
        assert w > Decimal("0")
    total = sum(weights, Decimal("0"))
    assert abs(total - Decimal("1")) < Decimal("1e-25")


@given(
    entry=st.decimals(min_value=Decimal("100"), max_value=Decimal("10000"),
                     allow_nan=False, allow_infinity=False, places=2),
    risk=st.decimals(min_value=Decimal("0.5"), max_value=Decimal("50"),
                    allow_nan=False, allow_infinity=False, places=2),
    distances=st.lists(
        st.decimals(min_value=Decimal("0.01"), max_value=Decimal("500"),
                   allow_nan=False, allow_infinity=False, places=2),
        min_size=2,
        max_size=8,
        unique=True,
    ),
)
@settings(max_examples=150, deadline=None, suppress_health_check=[HealthCheck.too_slow])
def test_property_runner_weight_is_largest(
    entry: Decimal,
    risk: Decimal,
    distances: list[Decimal],
) -> None:
    """When TPs are sorted by distance from entry, the furthest one (runner)
    must receive the largest weight."""
    distances_sorted = sorted(distances)
    legs = [
        TPLeg(price=entry - d, label="lvn", leg_index=i)
        for i, d in enumerate(distances_sorted)
    ]
    sl = entry + risk
    weights = compute_partial_weights(entry, sl, legs)
    assert weights[-1] == max(weights)
