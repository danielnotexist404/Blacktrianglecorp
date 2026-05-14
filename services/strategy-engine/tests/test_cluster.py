from __future__ import annotations

from decimal import Decimal

from btg_strategy.signal.cluster import resolve_lvn_cluster
from btg_strategy.types import LVN, LVNClass


def _lvn(low: float, high: float, depth: float, cls: LVNClass) -> LVN:
    return LVN(
        low=Decimal(str(low)),
        high=Decimal(str(high)),
        depth=Decimal(str(depth)),
        classification=cls,
    )


def test_empty_candidates_returns_none() -> None:
    assert resolve_lvn_cluster([], "both", []) is None


def test_large_only_picks_deepest_large() -> None:
    a = _lvn(100, 101, 0.4, "large")
    b = _lvn(102, 103, 0.7, "large")
    c = _lvn(104, 105, 0.2, "small")
    result = resolve_lvn_cluster([a, b, c], "large_only", [])
    assert result is b


def test_large_only_returns_none_when_all_small() -> None:
    a = _lvn(100, 101, 0.4, "small")
    b = _lvn(102, 103, 0.2, "small")
    result = resolve_lvn_cluster([a, b], "large_only", [])
    assert result is None


def test_small_only_picks_shallowest_small() -> None:
    a = _lvn(100, 101, 0.3, "small")
    b = _lvn(102, 103, 0.2, "small")
    c = _lvn(104, 105, 0.7, "large")
    result = resolve_lvn_cluster([a, b, c], "small_only", [])
    assert result is b


def test_small_only_returns_none_when_all_large() -> None:
    a = _lvn(100, 101, 0.7, "large")
    result = resolve_lvn_cluster([a], "small_only", [])
    assert result is None


def test_both_picks_first_tested_in_cluster() -> None:
    a = _lvn(100, 101, 0.4, "large")
    b = _lvn(102, 103, 0.7, "small")
    c = _lvn(104, 105, 0.2, "large")
    # Test order: b first, then a, then c.
    result = resolve_lvn_cluster([a, c], "both", [b, a, c])
    assert result is a


def test_both_falls_back_to_first_candidate_when_test_order_misses() -> None:
    a = _lvn(100, 101, 0.4, "large")
    b = _lvn(102, 103, 0.7, "small")
    result = resolve_lvn_cluster([a, b], "both", [])
    assert result is a


def test_single_candidate_returns_itself_regardless_of_mode() -> None:
    a = _lvn(100, 101, 0.4, "large")
    assert resolve_lvn_cluster([a], "large_only", []) is a
    assert resolve_lvn_cluster([a], "both", []) is a

    b = _lvn(100, 101, 0.4, "small")
    assert resolve_lvn_cluster([b], "small_only", []) is b
