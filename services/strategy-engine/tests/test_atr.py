from __future__ import annotations

from datetime import datetime, timedelta
from decimal import Decimal

import pytest

from btg_strategy.indicators.atr import compute_atr
from btg_strategy.types import Candle


def _candle(
    high: float | str, low: float | str, close: float | str, t: datetime
) -> Candle:
    return Candle(
        open_time=t,
        close_time=t + timedelta(hours=1),
        open=Decimal(str(close)),  # open is irrelevant for ATR
        high=Decimal(str(high)),
        low=Decimal(str(low)),
        close=Decimal(str(close)),
        volume=Decimal("1"),
    )


def test_rejects_zero_period() -> None:
    cs = [_candle(101, 99, 100, datetime(2024, 1, 1))]
    with pytest.raises(ValueError):
        compute_atr(cs, period=0)


def test_rejects_too_few_candles() -> None:
    cs = [_candle(101, 99, 100, datetime(2024, 1, 1, h)) for h in range(14)]
    with pytest.raises(ValueError, match="at least 15"):
        compute_atr(cs, period=14)


def test_constant_range_atr_equals_range() -> None:
    cs = [_candle(110, 90, 100, datetime(2024, 1, 1, h)) for h in range(20)]
    assert compute_atr(cs, period=14) == Decimal("20")


def test_wilder_smoothing_responds_to_widening_range() -> None:
    cs = [_candle(101, 99, 100, datetime(2024, 1, 1, h)) for h in range(15)]
    cs.append(_candle(120, 80, 100, datetime(2024, 1, 1, 15)))
    # First 14 TRs all = 2 (high-low). Initial ATR = 2.
    # Wide candle: TR = max(40, |120-100|, |80-100|) = 40.
    # Smoothed: (2 * 13 + 40) / 14 = 66/14
    expected = (Decimal("2") * Decimal("13") + Decimal("40")) / Decimal("14")
    assert compute_atr(cs, period=14) == expected


def test_tr_uses_gap_against_prior_close() -> None:
    # Gap up: candle range narrow but distance from prior close large.
    cs = [_candle(101, 99, 100, datetime(2024, 1, 1, h)) for h in range(14)]
    # Prior close was 100; new candle opens far higher, narrow range.
    cs.append(_candle(151, 149, 150, datetime(2024, 1, 1, 14)))
    # 14 candles total — need 15 for period=14. Add one more identical.
    cs.append(_candle(151, 149, 150, datetime(2024, 1, 1, 15)))
    atr = compute_atr(cs, period=14)
    # TRs[1..13] = 2 each.
    # TRs[14] (the gap candle) = max(2, |151-100|, |149-100|) = 51
    # TRs[15] = max(2, |151-150|, |149-150|) = 2
    # trs list has 15 entries; initial atr = mean(trs[0..13]) = mean of TR[1..14]
    # = (2*13 + 51) / 14 = 77/14
    # Then one smoothing step with TR[15]=2:
    # atr = (77/14 * 13 + 2) / 14
    initial = (Decimal("2") * Decimal("13") + Decimal("51")) / Decimal("14")
    expected = (initial * Decimal("13") + Decimal("2")) / Decimal("14")
    assert atr == expected


def test_atr_period_one_returns_last_tr() -> None:
    cs = [_candle(101, 99, 100, datetime(2024, 1, 1, h)) for h in range(5)]
    cs.append(_candle(110, 90, 100, datetime(2024, 1, 1, 5)))
    # With period=1, initial atr = TR[1] = 2, smoothing for each subsequent
    # TR replaces atr fully: (atr * 0 + tr) / 1 = tr. Final atr = last TR.
    assert compute_atr(cs, period=1) == Decimal("20")
