from __future__ import annotations

from decimal import Decimal

import pytest
from hypothesis import HealthCheck, given, settings, strategies as st

from btg_strategy.profile.lvn_detect import detect_lvns


def _rv(*vals: float | int | str) -> list[Decimal]:
    return [Decimal(str(v)) for v in vals]


# ----- input validation -----


def test_rejects_empty_row_volume() -> None:
    with pytest.raises(ValueError, match="non-empty"):
        detect_lvns([], Decimal("100"), Decimal("1"))


def test_rejects_invalid_neighbor_pct() -> None:
    rv = _rv(1, 2, 3)
    with pytest.raises(ValueError):
        detect_lvns(rv, Decimal("100"), Decimal("1"), neighbor_pct=Decimal("0"))
    with pytest.raises(ValueError):
        detect_lvns(rv, Decimal("100"), Decimal("1"), neighbor_pct=Decimal("0.6"))


def test_rejects_invalid_extend_threshold() -> None:
    rv = _rv(1, 2, 3)
    with pytest.raises(ValueError):
        detect_lvns(rv, Decimal("100"), Decimal("1"), extend_threshold=Decimal("-0.1"))
    with pytest.raises(ValueError):
        detect_lvns(rv, Decimal("100"), Decimal("1"), extend_threshold=Decimal("1"))


def test_rejects_non_positive_row_step() -> None:
    with pytest.raises(ValueError):
        detect_lvns(_rv(1, 2, 3), Decimal("100"), Decimal("0"))


def test_rejects_non_positive_max_lvn_height() -> None:
    with pytest.raises(ValueError):
        detect_lvns(_rv(1, 2, 3), Decimal("100"), Decimal("1"), max_lvn_height=Decimal("0"))


# ----- seed detection (Phase 1) -----


def test_constant_row_volume_no_lvns() -> None:
    rv = _rv(*[10] * 100)
    assert detect_lvns(rv, Decimal("100"), Decimal("1")) == []


def test_single_isolated_zero_row_seeds_one_lvn() -> None:
    rv = _rv(*([10] * 50 + [0] + [10] * 49))
    lvns = detect_lvns(rv, Decimal("0"), Decimal("1"))
    assert len(lvns) == 1
    low, high, depth = lvns[0]
    assert low == Decimal("50")
    assert high == Decimal("51")
    # depth = 1 - 0/10 (all neighbors are 10) = 1
    assert depth == Decimal("1")


def test_strict_detection_means_adjacent_zeros_disqualify_each_other() -> None:
    # Each zero row has a zero neighbor — none is strictly less than every
    # neighbor, so no seeds, so no LVNs.
    rv = _rv(*([10] * 48 + [0, 0, 0] + [10] * 49))
    lvns = detect_lvns(rv, Decimal("0"), Decimal("1"))
    assert lvns == []


def test_two_separated_gaps_produce_two_lvns() -> None:
    rv = _rv(*([10] * 30 + [0] + [10] * 39 + [0] + [10] * 29))
    lvns = detect_lvns(rv, Decimal("0"), Decimal("1"))
    assert len(lvns) == 2
    assert lvns[0][1] <= lvns[1][0]


def test_edge_row_seeds_via_sentinel_padding() -> None:
    rv = _rv(0, *([10] * 99))
    lvns = detect_lvns(rv, Decimal("100"), Decimal("1"))
    assert len(lvns) >= 1
    assert lvns[0][0] == Decimal("100")


# ----- extension (Phase 2) -----


def test_valley_extension_absorbs_neighbors_below_threshold() -> None:
    # Pattern: ...10, 8, 5, 3, 1, 3, 5, 8, 10...
    # Seed at the 1 (strict min). local_mean of the ±7 window includes
    # the 8/5/3/1/3/5/8 plus surrounding 10s (and any sentinel padding).
    # With extend_threshold=0.3, threshold = 0.7 * local_mean. The 3s and 5s
    # should fall below threshold; the 8s should not.
    rv = _rv(*([10] * 45 + [8, 5, 3, 1, 3, 5, 8] + [10] * 48))
    lvns = detect_lvns(rv, Decimal("0"), Decimal("1"))
    assert len(lvns) == 1
    low, high, _depth = lvns[0]
    # Seed is row 48 (the 1). Extension should reach the 3s (rows 47 and 49)
    # and the 5s (rows 46 and 50) — but stop at the 8s (rows 45 and 51).
    assert low == Decimal("46")
    assert high == Decimal("51")


def test_extension_stops_at_high_volume_wall() -> None:
    # Seed (1) flanked tightly by 10s — no extension possible.
    rv = _rv(*([10] * 50 + [1] + [10] * 49))
    lvns = detect_lvns(rv, Decimal("0"), Decimal("1"))
    assert len(lvns) == 1
    low, high, _ = lvns[0]
    assert high - low == Decimal("1")  # single-row LVN


def test_max_lvn_height_caps_extension() -> None:
    # Deep wide valley that would otherwise extend many rows.
    rv = _rv(*([10] * 40 + [3] * 5 + [1] + [3] * 5 + [10] * 49))
    no_cap = detect_lvns(rv, Decimal("0"), Decimal("1"))
    capped = detect_lvns(
        rv, Decimal("0"), Decimal("1"), max_lvn_height=Decimal("3")
    )
    assert len(no_cap) == 1
    assert len(capped) == 1
    capped_height = capped[0][1] - capped[0][0]
    no_cap_height = no_cap[0][1] - no_cap[0][0]
    assert capped_height <= Decimal("3")
    assert capped_height < no_cap_height


def test_extension_uses_frozen_local_mean_not_post_extension_mean() -> None:
    # If local_mean were recomputed inside the extension loop, threshold would
    # decay as low-volume rows get absorbed, and the cluster could swallow
    # rows that should remain neighbors. Verify by asymmetric pattern:
    # high cluster of low-but-not-extending rows on one side; with frozen
    # mean those rows still fail the threshold.
    rv = _rv(
        *(
            [10] * 30          # high vol
            + [7] * 12          # near-threshold on the left
            + [1]               # seed
            + [10] * 57         # high vol on the right
        )
    )
    lvns = detect_lvns(rv, Decimal("0"), Decimal("1"))
    assert len(lvns) == 1
    low, high, _ = lvns[0]
    # With local_mean frozen at ~10 (real neighbors are mostly high vol
    # because no_n=7 reaches into the 10-block on the right; plus 7 left),
    # threshold = 0.7 * local_mean ~ 7. The 7s fail the *strict less-than*
    # threshold condition (vol < threshold), so extension stops immediately
    # to the left. To the right, the very next row is 10 (above threshold).
    # Expect a single-row LVN at the seed.
    assert high - low == Decimal("1")


# ----- depth and merge -----


def test_depth_in_unit_interval() -> None:
    rv = _rv(*([10] * 50 + [0] + [10] * 49))
    lvns = detect_lvns(rv, Decimal("0"), Decimal("1"))
    for _low, _high, depth in lvns:
        assert Decimal("0") <= depth <= Decimal("1")


def test_overlapping_extensions_merge_with_max_depth() -> None:
    # Two seeds whose extensions overlap into the same span.
    rv = _rv(
        *(
            [10] * 25
            + [3, 3]                       # rows 25,26: ext zone for left seed
            + [0.5]                        # row 27: seed A (vt=0.5)
            + [3, 3, 3, 3, 3, 3, 3, 3, 3]  # rows 28-36: shared extension corridor
            + [0.1]                        # row 37: seed B (vt=0.1)
            + [3, 3]                       # rows 38-39: ext zone for right seed
            + [10] * 60
        )
    )
    lvns = detect_lvns(rv, Decimal("0"), Decimal("1"))
    # Phase 3 strict-overlap merge → single LVN.
    assert len(lvns) == 1
    _low, _high, depth = lvns[0]

    # Replicate seed B's depth calculation through the same Decimal
    # arithmetic path the algorithm uses. B's frozen ±7 window contains
    # 9 threes (rows 30-36 and 38-39) + 5 tens (rows 40-44) excluding seed.
    b_window = [Decimal("3")] * 9 + [Decimal("10")] * 5
    b_local_mean = sum(b_window, Decimal("0")) / Decimal(14)
    expected = Decimal("1") - Decimal("0.1") / b_local_mean
    assert depth == expected


# ----- hypothesis properties -----

_VOLUME = st.decimals(
    min_value=Decimal("0"),
    max_value=Decimal("1000"),
    allow_nan=False,
    allow_infinity=False,
    places=2,
)


@given(rv=st.lists(_VOLUME, min_size=20, max_size=200))
@settings(max_examples=200, deadline=None, suppress_health_check=[HealthCheck.too_slow])
def test_property_lvn_bounds_within_profile(rv: list[Decimal]) -> None:
    lvns = detect_lvns(rv, Decimal("0"), Decimal("1"))
    for low, high, depth in lvns:
        assert high > low
        assert low >= Decimal("0")
        assert high <= Decimal(len(rv))
        assert Decimal("0") <= depth <= Decimal("1")


@given(rv=st.lists(_VOLUME, min_size=20, max_size=200))
@settings(max_examples=200, deadline=None, suppress_health_check=[HealthCheck.too_slow])
def test_property_lvns_are_non_overlapping_and_sorted(rv: list[Decimal]) -> None:
    lvns = detect_lvns(rv, Decimal("0"), Decimal("1"))
    for i in range(len(lvns) - 1):
        # Strict-overlap merge means touching is allowed (adjacent but not
        # overlapping). Use <= to allow that.
        assert lvns[i][1] <= lvns[i + 1][0]


@given(
    rv=st.lists(_VOLUME, min_size=20, max_size=200),
    cap=st.decimals(
        min_value=Decimal("1"),
        max_value=Decimal("20"),
        allow_nan=False,
        allow_infinity=False,
        places=2,
    ),
)
@settings(max_examples=100, deadline=None, suppress_health_check=[HealthCheck.too_slow])
def test_property_max_lvn_height_is_respected(rv: list[Decimal], cap: Decimal) -> None:
    lvns = detect_lvns(rv, Decimal("0"), Decimal("1"), max_lvn_height=cap)
    for low, high, _depth in lvns:
        assert high - low <= cap
