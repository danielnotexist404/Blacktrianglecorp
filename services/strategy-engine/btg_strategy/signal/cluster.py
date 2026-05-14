from __future__ import annotations

from typing import Optional, Sequence

from btg_strategy.types import LVN, FocusMode


def resolve_lvn_cluster(
    candidates: Sequence[LVN],
    focus_mode: FocusMode,
    test_order: Sequence[LVN],
) -> Optional[LVN]:
    """Pick one LVN from a cluster per the user's `lvn_focus_mode` setting.

    The caller is responsible for cluster identification — that is, deciding
    which LVNs sit within 0.5 * ATR_14 of each other. This function only
    selects within an already-bundled cluster.

    Selection rules (locked):
        large_only -> filter to 'large', pick deepest gap.
        small_only -> filter to 'small', pick shallowest gap.
        both       -> pick the LVN that was tested first (per `test_order`).

    Args:
        candidates: LVNs in the cluster.
        focus_mode: User setting.
        test_order: All LVNs in the order they were first tested. The first
            entry that exists in `candidates` is selected for 'both'.

    Returns:
        The selected LVN, or None if the focus_mode filter eliminates every
        candidate, or if `candidates` is empty.
    """
    if not candidates:
        return None

    if focus_mode == "large_only":
        filtered = [lvn for lvn in candidates if lvn.classification == "large"]
        if not filtered:
            return None
        return max(filtered, key=lambda l: l.depth)

    if focus_mode == "small_only":
        filtered = [lvn for lvn in candidates if lvn.classification == "small"]
        if not filtered:
            return None
        return min(filtered, key=lambda l: l.depth)

    # focus_mode == "both"
    candidate_keys = {(c.low, c.high) for c in candidates}
    for lvn in test_order:
        if (lvn.low, lvn.high) in candidate_keys:
            return lvn
    return candidates[0]
