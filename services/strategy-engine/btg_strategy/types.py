from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from typing import Literal


PolarityMethod = Literal["bar", "pressure"]
Side = Literal["long", "short"]
LVNClass = Literal["large", "small"]
TPLabel = Literal["lvn", "vah", "poc", "val", "runner"]
FocusMode = Literal["large_only", "small_only", "both"]
RejectionResult = Literal["confirmed", "invalidated"]


@dataclass(frozen=True)
class Candle:
    open_time: datetime
    close_time: datetime
    open: Decimal
    high: Decimal
    low: Decimal
    close: Decimal
    volume: Decimal


@dataclass(frozen=True)
class LVN:
    low: Decimal
    high: Decimal
    depth: Decimal
    classification: LVNClass


@dataclass(frozen=True)
class VolumeProfile:
    poc: Decimal
    vah: Decimal
    val: Decimal
    profile_high: Decimal
    profile_low: Decimal
    row_step: Decimal
    row_count: int
    row_volume: tuple[Decimal, ...]
    row_up_volume: tuple[Decimal, ...]
    polarity_method: PolarityMethod


@dataclass(frozen=True)
class TPLeg:
    price: Decimal
    label: TPLabel
    leg_index: int


@dataclass(frozen=True)
class EvaluatorSettings:
    focus_mode: FocusMode
    two_bar_confirmation: bool = False
    cluster_atr_factor: Decimal = Decimal("0.5")


@dataclass(frozen=True)
class EvaluatorState:
    test_order: tuple[LVN, ...] = ()


@dataclass(frozen=True)
class Setup:
    side: Side
    triggering_lvn: LVN
    trigger_candle: Candle
