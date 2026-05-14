from __future__ import annotations

from btg_strategy.types import Candle, LVN, RejectionResult, Side


def detect_wick_into_lvn(candle: Candle, lvn: LVN, side: Side) -> bool:
    """Did this H1 candle's wick puncture the LVN box from the correct side?

    Short setup: price rallying from below into the LVN — qualifies when
        candle.high >= lvn.low.
    Long setup:  price dropping from above into the LVN — qualifies when
        candle.low <= lvn.high.
    """
    if side == "short":
        return candle.high >= lvn.low
    return candle.low <= lvn.high


def detect_rejection_close(
    candle: Candle, lvn: LVN, side: Side
) -> RejectionResult:
    """Classify the close of a candle that wicked into an LVN.

    Short:
        close <  lvn.low  -> 'confirmed'   (closed back below the LVN)
        close >= lvn.low  -> 'invalidated' (closed inside or above the LVN)

    Long:
        close >  lvn.high -> 'confirmed'   (closed back above the LVN)
        close <= lvn.high -> 'invalidated' (closed inside or below the LVN)
    """
    if side == "short":
        return "confirmed" if candle.close < lvn.low else "invalidated"
    return "confirmed" if candle.close > lvn.high else "invalidated"
