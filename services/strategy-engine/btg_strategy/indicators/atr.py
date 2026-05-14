from __future__ import annotations

from decimal import Decimal
from typing import Sequence

from btg_strategy.types import Candle


_ONE = Decimal("1")


def compute_atr(
    candles: Sequence[Candle],
    period: int = 14,
) -> Decimal:
    """Wilder's ATR for the most-recently-closed candle.

    True range:
        TR[i] = max(high[i] - low[i],
                    |high[i] - close[i-1]|,
                    |low[i]  - close[i-1]|)

    TR is defined from i=1 onward (i=0 has no prior close). Initial ATR is
    the simple mean of TR[1..period]. Subsequent values use Wilder smoothing:

        ATR[i] = (ATR[i-1] * (period - 1) + TR[i]) / period

    Args:
        candles: Closed candles ordered oldest-to-newest.
        period: ATR period. Default 14.

    Raises:
        ValueError: period < 1 or fewer than period+1 candles supplied.
    """
    if period < 1:
        raise ValueError("period must be >= 1")
    if len(candles) < period + 1:
        raise ValueError(
            f"need at least {period + 1} candles for ATR({period}), got {len(candles)}"
        )

    period_d = Decimal(period)

    trs: list[Decimal] = []
    for i in range(1, len(candles)):
        h = candles[i].high
        l = candles[i].low
        prev_close = candles[i - 1].close
        trs.append(max(h - l, abs(h - prev_close), abs(l - prev_close)))

    atr = sum(trs[:period], Decimal("0")) / period_d
    for tr in trs[period:]:
        atr = (atr * (period_d - _ONE) + tr) / period_d
    return atr
