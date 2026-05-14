from __future__ import annotations

from decimal import Decimal
from typing import Sequence

from btg_strategy.types import Candle, PolarityMethod, VolumeProfile


_MIN_TICK = Decimal("0.00000001")  # 1e-8 — guards against zero-range division
_ZERO = Decimal("0")
_ONE = Decimal("1")
_HALF = Decimal("0.5")


def build_volume_profile(
    candles: Sequence[Candle],
    row_count: int = 100,
    va_pct: Decimal = Decimal("0.68"),
    polarity_method: PolarityMethod = "bar",
) -> VolumeProfile:
    """Construct a volume profile from closed H1 candles.

    Each candle's volume is distributed across the rows its [low, high] spans,
    proportional to the price-range fraction in each row (volume is conserved
    exactly modulo Decimal rounding). POC = argmax row; VAH/VAL expand
    symmetrically from POC until `va_pct` of total volume is captured, ties
    broken in favour of the larger adjacent row (mirrors HDLX_VP.pine
    lines 482-514).

    Args:
        candles: Closed H1 candles, ordered oldest-to-newest. Non-empty.
        row_count: Number of price rows in the profile. Must be >= 2.
        va_pct: Value area fraction. Must be in (0, 1]. Default 0.68 (68%).
        polarity_method: Internal A/B switch for up-volume classification.
            'bar' (default): up if close > open.
            'pressure':      up if (close - low) > (high - close).
            Only affects row_up_volume; POC/VAH/VAL/row_volume are invariant.

    Raises:
        ValueError: empty candles, row_count < 2, or va_pct outside (0, 1].
    """
    if not candles:
        raise ValueError("candles must be non-empty")
    if row_count < 2:
        raise ValueError("row_count must be >= 2")
    if not (_ZERO < va_pct <= _ONE):
        raise ValueError("va_pct must be in (0, 1]")

    profile_low = min(c.low for c in candles)
    profile_high = max(c.high for c in candles)
    row_step = max((profile_high - profile_low) / Decimal(row_count), _MIN_TICK)

    row_volume: list[Decimal] = [_ZERO] * row_count
    row_up_volume: list[Decimal] = [_ZERO] * row_count

    for c in candles:
        is_up = _is_up_bar(c, polarity_method)
        candle_range = c.high - c.low

        if candle_range < _MIN_TICK:
            # Zero-range bar (doji): allocate the full volume to the single
            # row containing its price. Clamp to the profile's edge rows in
            # case integer-division rounding pushes the index out of bounds.
            target = max(min(int((c.low - profile_low) // row_step), row_count - 1), 0)
            row_volume[target] += c.volume
            if is_up:
                row_up_volume[target] += c.volume
            continue

        start_row = max(int((c.low - profile_low) // row_step), 0)
        end_row = min(int((c.high - profile_low) // row_step), row_count - 1)

        for i in range(start_row, end_row + 1):
            row_bottom = profile_low + Decimal(i) * row_step
            row_top = row_bottom + row_step
            # Clamp the overlap to within the row; numerically robust against
            # rounding when c.high == profile_high or c.low == profile_low.
            effective_low = c.low if c.low > row_bottom else row_bottom
            effective_high = c.high if c.high < row_top else row_top
            if effective_high <= effective_low:
                continue
            v_por = (effective_high - effective_low) / candle_range

            contribution = c.volume * v_por
            row_volume[i] += contribution
            if is_up:
                row_up_volume[i] += contribution

    poc_row = max(range(row_count), key=lambda i: row_volume[i])
    upper_row, lower_row = _expand_value_area(row_volume, poc_row, va_pct)
    # Clamp to [profile_low, profile_high]: when (profile_high - profile_low)
    # is zero or below row_count*_MIN_TICK, row_step gets floored and the raw
    # boundaries can spill past the profile edges. Clamping keeps the
    # invariant val <= poc <= vah <= profile_high in every case.
    poc = min(profile_low + (Decimal(poc_row) + _HALF) * row_step, profile_high)
    vah = min(profile_low + (Decimal(upper_row) + _ONE) * row_step, profile_high)
    val = max(profile_low + Decimal(lower_row) * row_step, profile_low)

    return VolumeProfile(
        poc=poc,
        vah=vah,
        val=val,
        profile_high=profile_high,
        profile_low=profile_low,
        row_step=row_step,
        row_count=row_count,
        row_volume=tuple(row_volume),
        row_up_volume=tuple(row_up_volume),
        polarity_method=polarity_method,
    )


def _is_up_bar(c: Candle, method: PolarityMethod) -> bool:
    if method == "bar":
        return c.close > c.open
    return (c.close - c.low) > (c.high - c.close)


def _expand_value_area(
    row_volume: list[Decimal],
    poc_row: int,
    va_pct: Decimal,
) -> tuple[int, int]:
    """Symmetric POC expansion. Returns (upper_row, lower_row) inclusive bounds.

    Tie-break (plus >= minus) matches HDLX_VP.pine line 505 ('vaP >= vbP').
    """
    row_count = len(row_volume)
    total = sum(row_volume, _ZERO)
    target = total * va_pct
    captured = row_volume[poc_row]
    upper = poc_row
    lower = poc_row
    max_iter = row_count * 2  # Pine maxIter guard
    for _ in range(max_iter):
        if captured >= target:
            break
        if upper == row_count - 1 and lower == 0:
            break
        plus = row_volume[upper + 1] if upper < row_count - 1 else Decimal("-1")
        minus = row_volume[lower - 1] if lower > 0 else Decimal("-1")
        if plus >= minus:
            captured += plus
            upper += 1
        else:
            captured += minus
            lower -= 1
    return upper, lower
