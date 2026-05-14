from __future__ import annotations

from decimal import Decimal

from btg_strategy.profile.classify import classify_lvns


def test_empty_input_returns_empty() -> None:
    assert classify_lvns([]) == []


def test_single_lvn_classified_large() -> None:
    out = classify_lvns([(Decimal("100"), Decimal("101"), Decimal("0.5"))])
    assert len(out) == 1
    assert out[0].classification == "large"
    assert out[0].depth == Decimal("0.5")


def test_two_distinct_depths_split_at_midpoint() -> None:
    raw = [
        (Decimal("100"), Decimal("101"), Decimal("0.3")),
        (Decimal("200"), Decimal("201"), Decimal("0.7")),
    ]
    out = classify_lvns(raw)
    # median = 0.5; 0.3 < 0.5 -> small; 0.7 >= 0.5 -> large
    assert out[0].classification == "small"
    assert out[1].classification == "large"


def test_three_lvns_median_is_middle() -> None:
    raw = [
        (Decimal("100"), Decimal("101"), Decimal("0.2")),
        (Decimal("200"), Decimal("201"), Decimal("0.5")),
        (Decimal("300"), Decimal("301"), Decimal("0.8")),
    ]
    out = classify_lvns(raw)
    assert [lvn.classification for lvn in out] == ["small", "large", "large"]


def test_preserves_input_order_even_when_unsorted_by_price() -> None:
    raw = [
        (Decimal("200"), Decimal("201"), Decimal("0.8")),
        (Decimal("100"), Decimal("101"), Decimal("0.2")),
    ]
    out = classify_lvns(raw)
    assert out[0].low == Decimal("200")
    assert out[1].low == Decimal("100")


def test_ties_at_median_fall_to_large() -> None:
    # Even number, both halves equal: median == 0.5, both qualify >=
    raw = [
        (Decimal("100"), Decimal("101"), Decimal("0.5")),
        (Decimal("200"), Decimal("201"), Decimal("0.5")),
    ]
    out = classify_lvns(raw)
    assert [lvn.classification for lvn in out] == ["large", "large"]


def test_depth_field_preserved_verbatim() -> None:
    raw = [
        (Decimal("100"), Decimal("101"), Decimal("0.1234567")),
        (Decimal("200"), Decimal("201"), Decimal("0.9876543")),
    ]
    out = classify_lvns(raw)
    assert out[0].depth == Decimal("0.1234567")
    assert out[1].depth == Decimal("0.9876543")
