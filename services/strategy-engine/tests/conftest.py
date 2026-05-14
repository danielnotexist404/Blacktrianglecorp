from __future__ import annotations

from datetime import datetime, timedelta
from decimal import Decimal

from btg_strategy.types import Candle


def make_candle(
    open_p: float | str | Decimal,
    high: float | str | Decimal,
    low: float | str | Decimal,
    close: float | str | Decimal,
    volume: float | str | Decimal,
    t: datetime | None = None,
) -> Candle:
    if t is None:
        t = datetime(2024, 1, 1)
    return Candle(
        open_time=t,
        close_time=t + timedelta(hours=1),
        open=Decimal(str(open_p)),
        high=Decimal(str(high)),
        low=Decimal(str(low)),
        close=Decimal(str(close)),
        volume=Decimal(str(volume)),
    )
