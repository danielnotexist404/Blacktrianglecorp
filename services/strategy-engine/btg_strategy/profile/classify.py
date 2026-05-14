from __future__ import annotations

from decimal import Decimal
from typing import Sequence

from btg_strategy.types import LVN


_TWO = Decimal("2")


def classify_lvns(
    raw_lvns: Sequence[tuple[Decimal, Decimal, Decimal]],
) -> list[LVN]:
    """Classify each LVN as 'large' or 'small' via median split on depth.

    `depth >= median` -> 'large'; `depth < median` -> 'small'.
    Median is computed over the supplied set on every call (no caching —
    classification is recomputed each VP rebuild per locked rule).

    Single-LVN sets always classify as 'large' (median == depth, depth >=
    median holds). Ties at the median fall to 'large'.

    Args:
        raw_lvns: (low, high, depth) tuples from `detect_lvns()`.

    Returns:
        LVN dataclasses in the same order as the input.
    """
    if not raw_lvns:
        return []

    depths = sorted(d for _, _, d in raw_lvns)
    n = len(depths)
    if n % 2 == 1:
        median = depths[n // 2]
    else:
        median = (depths[n // 2 - 1] + depths[n // 2]) / _TWO

    return [
        LVN(
            low=low,
            high=high,
            depth=depth,
            classification="large" if depth >= median else "small",
        )
        for (low, high, depth) in raw_lvns
    ]
