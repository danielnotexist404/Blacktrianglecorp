from __future__ import annotations

from decimal import Decimal
from typing import Optional, Sequence


_ZERO = Decimal("0")
_ONE = Decimal("1")


def detect_lvns(
    row_volume: Sequence[Decimal],
    profile_low: Decimal,
    row_step: Decimal,
    neighbor_pct: Decimal = Decimal("0.07"),
    extend_threshold: Decimal = Decimal("0.3"),
    max_lvn_height: Optional[Decimal] = None,
) -> list[tuple[Decimal, Decimal, Decimal]]:
    """Detect LVN gaps via the B2 algorithm: strict-min seed + bounded extension.

    Phase 1 — seeds.
        A row qualifies as a seed if its volume is strictly less than every
        row in a +/-`no_n` window, where `no_n = round(row_count * neighbor_pct)`.
        Sentinel-padded at edges with `max(row_volume)` so edge rows can
        qualify. (Identical to HDLX_VP.pine lines 563-596.)

    Phase 2 — extension (per seed).
        For each seed, freeze a `local_mean` computed over the original
        ±no_n window (sentinel-padded, excluding the seed itself). Extend
        left and right while:
            row_volume[adjacent] < (1 - extend_threshold) * local_mean
        AND (if `max_lvn_height` is supplied):
            extended_height + row_step <= max_lvn_height
        The frozen local_mean is deliberate — it prevents threshold decay
        during extension, which would let the cluster swallow neighbors
        indefinitely.

    Phase 3 — merge.
        If two seed extensions overlap (one's row range includes a row
        from another), they merge into one LVN spanning the union of
        their row ranges. depth = max(seed depths). Touching extensions
        (adjacent but not overlapping) do NOT merge.

    Phase 4 — post-merge trim.
        Per-seed extension respects `max_lvn_height`, but the UNION of two
        overlapping extensions can exceed it. When that happens, the merged
        extent is trimmed back to fit `max_lvn_height`, centered on the
        deepest-seed row inside it. This preserves the strict-min seed
        within every emitted LVN.

    Depth per seed:
        depth = 1 - (vt_seed / local_mean), clamped to [0, 1].

    Args:
        row_volume: Total volume per row, ordered low-price to high-price.
        profile_low: Bottom of the profile range.
        row_step: Height (in price) of each row.
        neighbor_pct: Window fraction. Default 0.07 (matches Pine `vgNoN`).
        extend_threshold: Volume cutoff fraction. Adjacent row qualifies for
            extension if vol < (1 - extend_threshold) * local_mean.
            Default 0.3 -> threshold = 0.7 * local_mean.
        max_lvn_height: Optional hard cap (in price units) on extended LVN
            height. Typically `1.5 * ATR_14`. If None, no cap.

    Raises:
        ValueError: empty row_volume, neighbor_pct outside (0, 0.5],
            extend_threshold outside [0, 1), row_step <= 0,
            max_lvn_height <= 0 (when supplied).

    Returns:
        List of (low, high, depth) tuples ordered low-price to high-price.
    """
    if not row_volume:
        raise ValueError("row_volume must be non-empty")
    if not (_ZERO < neighbor_pct <= Decimal("0.5")):
        raise ValueError("neighbor_pct must be in (0, 0.5]")
    if not (_ZERO <= extend_threshold < _ONE):
        raise ValueError("extend_threshold must be in [0, 1)")
    if row_step <= _ZERO:
        raise ValueError("row_step must be > 0")
    if max_lvn_height is not None:
        if max_lvn_height <= _ZERO:
            raise ValueError("max_lvn_height must be > 0 when supplied")
        if max_lvn_height < row_step:
            raise ValueError("max_lvn_height must be >= row_step when supplied")

    row_count = len(row_volume)
    # Floor (truncate toward zero) — matches Pine's `int(vpNR * vgNoN)`.
    no_n = max(1, int(Decimal(row_count) * neighbor_pct))
    max_vol = max(row_volume)
    padded = [max_vol] * no_n + list(row_volume) + [max_vol] * no_n

    # Phase 1 — seed detection.
    seeds: list[int] = []
    for center in range(row_count):
        pi = center + no_n
        center_vol = padded[pi]
        is_strict_min = True
        for j in range(pi - no_n, pi + no_n + 1):
            if j == pi:
                continue
            if padded[j] <= center_vol:
                is_strict_min = False
                break
        if is_strict_min:
            seeds.append(center)

    if not seeds:
        return []

    # Maximum extended-row count. Floor so the resulting height never
    # exceeds max_lvn_height; min of 1 (caller-side row_step <= max ensures
    # this is reachable).
    max_rows: Optional[int] = None
    if max_lvn_height is not None:
        max_rows = max(1, int(max_lvn_height / row_step))

    threshold_ratio = _ONE - extend_threshold

    # Phase 2 — extension. Track each extent's anchor (seed row) so we can
    # center any post-merge trim on the deepest seed.
    extents: list[tuple[int, int, Decimal, int]] = []
    for seed in seeds:
        pi = seed + no_n
        window_vals = [padded[k] for k in range(pi - no_n, pi + no_n + 1) if k != pi]
        local_mean = sum(window_vals, _ZERO) / Decimal(len(window_vals))
        threshold = local_mean * threshold_ratio
        seed_vol = row_volume[seed]

        start = seed
        end = seed

        while True:
            nxt = end + 1
            if nxt >= row_count:
                break
            if max_rows is not None and (nxt - start + 1) > max_rows:
                break
            if row_volume[nxt] >= threshold:
                break
            end = nxt

        while True:
            nxt = start - 1
            if nxt < 0:
                break
            if max_rows is not None and (end - nxt + 1) > max_rows:
                break
            if row_volume[nxt] >= threshold:
                break
            start = nxt

        if local_mean > _ZERO:
            raw_depth = _ONE - seed_vol / local_mean
        else:
            raw_depth = _ZERO
        depth = max(_ZERO, min(_ONE, raw_depth))

        extents.append((start, end, depth, seed))

    # Phase 3 — strict-overlap merge (low=min, high=max, depth=max).
    # Anchor follows the deepest seed; ties keep the earlier-emitted anchor.
    extents.sort(key=lambda e: e[0])
    merged: list[tuple[int, int, Decimal, int]] = []
    for ext_start, ext_end, ext_depth, ext_anchor in extents:
        if merged and ext_start <= merged[-1][1]:
            prev_start, prev_end, prev_depth, prev_anchor = merged[-1]
            if ext_depth > prev_depth:
                new_depth, new_anchor = ext_depth, ext_anchor
            else:
                new_depth, new_anchor = prev_depth, prev_anchor
            merged[-1] = (
                min(prev_start, ext_start),
                max(prev_end, ext_end),
                new_depth,
                new_anchor,
            )
        else:
            merged.append((ext_start, ext_end, ext_depth, ext_anchor))

    # Phase 4 — trim merged extents that exceeded max_rows after merge.
    # Per-seed extension already respects max_rows; only the union of two
    # overlapping extensions can violate it. Center the trim on the anchor
    # (deepest seed) so the kept rows include the strict-min seed itself.
    if max_rows is not None:
        trimmed: list[tuple[int, int, Decimal, int]] = []
        for m_start, m_end, m_depth, m_anchor in merged:
            if m_end - m_start + 1 > max_rows:
                half = (max_rows - 1) // 2
                t_start = max(m_anchor - half, m_start)
                t_end = t_start + max_rows - 1
                if t_end > m_end:
                    t_end = m_end
                    t_start = t_end - max_rows + 1
                trimmed.append((t_start, t_end, m_depth, m_anchor))
            else:
                trimmed.append((m_start, m_end, m_depth, m_anchor))
        merged = trimmed

    lvns: list[tuple[Decimal, Decimal, Decimal]] = []
    for ms, me, md, _ in merged:
        low = profile_low + Decimal(ms) * row_step
        high = profile_low + Decimal(me + 1) * row_step
        lvns.append((low, high, md))

    return lvns
