"""BTG Trader — LVN visual inspector.

Fetches H1 klines from Bybit perpetuals, runs
    build_volume_profile -> detect_lvns(B2) -> classify_lvns
and writes:
    1. A JSON dump of every LVN with (low, high, depth, classification).
    2. A PNG chart: candlesticks + LVN boxes + VAH/POC/VAL lines, styled
       per DESIGN.md.

Usage:
    .venv\\Scripts\\python.exe scripts/inspect_lvns.py --symbol BTC/USDT:USDT --days 30
"""
from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from pathlib import Path
from typing import Any

import ccxt  # type: ignore[import-untyped]
import matplotlib.pyplot as plt
from matplotlib.axes import Axes
from matplotlib.patches import Rectangle

from btg_strategy.indicators.atr import compute_atr
from btg_strategy.profile.classify import classify_lvns
from btg_strategy.profile.lvn_detect import detect_lvns
from btg_strategy.profile.volume_profile import build_volume_profile
from btg_strategy.types import LVN, Candle, VolumeProfile


# DESIGN.md tokens.
BG_BASE = "#000000"
BG_SURFACE = "#0A0A0B"
BORDER = "#1F1F24"
GRID = "#18181B"
TEXT_PRIMARY = "#F5F5F7"
TEXT_SECONDARY = "#A1A1AA"
CHART_UP = "#26A69A"
CHART_DOWN = "#EF5350"
CHART_VAH_VAL = "#2962FF"
CHART_POC = "#F44336"
LVN_COLOR = "#FF9800"


def fetch_h1(symbol: str, bars: int) -> list[Candle]:
    """Fetch the most recent `bars` H1 candles from Bybit perpetuals."""
    exchange = ccxt.bybit({"options": {"defaultType": "swap"}, "enableRateLimit": True})
    exchange.load_markets()

    one_hour_ms = 60 * 60 * 1000
    since = int(
        (datetime.now(timezone.utc) - timedelta(hours=bars + 10)).timestamp() * 1000
    )

    out: list[list[float]] = []
    while True:
        batch = exchange.fetch_ohlcv(symbol, timeframe="1h", since=since, limit=1000)
        if not batch:
            break
        out.extend(batch)
        since = int(batch[-1][0]) + one_hour_ms
        if len(batch) < 1000 or len(out) >= bars + 5:
            break

    # Drop any candle still forming (close_time > now).
    now_ms = int(datetime.now(timezone.utc).timestamp() * 1000)
    out = [c for c in out if int(c[0]) + one_hour_ms <= now_ms]
    out = out[-bars:]

    candles: list[Candle] = []
    for ts, o, h, l, c_, v in out:
        open_time = datetime.fromtimestamp(int(ts) / 1000, tz=timezone.utc)
        candles.append(
            Candle(
                open_time=open_time,
                close_time=open_time + timedelta(hours=1),
                open=Decimal(str(o)),
                high=Decimal(str(h)),
                low=Decimal(str(l)),
                close=Decimal(str(c_)),
                volume=Decimal(str(v)),
            )
        )
    return candles


def _draw_candles(ax: Axes, candles: list[Candle]) -> None:
    for x, c in enumerate(candles):
        is_up = c.close >= c.open
        color = CHART_UP if is_up else CHART_DOWN
        body_low = float(min(c.open, c.close))
        body_high = float(max(c.open, c.close))
        height = max(body_high - body_low, 1e-9)
        ax.add_patch(
            Rectangle(
                (x - 0.35, body_low),
                0.7,
                height,
                facecolor=color,
                edgecolor=color,
                linewidth=0,
                zorder=2,
            )
        )
        ax.vlines(x, float(c.low), float(c.high), color=color, linewidth=0.8, zorder=2)


def render_chart(
    candles: list[Candle],
    profile: VolumeProfile,
    lvns: list[LVN],
    atr: Decimal,
    out_path: Path,
    symbol: str,
) -> None:
    n = len(candles)
    fig, ax = plt.subplots(figsize=(16, 9), facecolor=BG_BASE)
    ax.set_facecolor(BG_SURFACE)

    for lvn in lvns:
        alpha = 0.30 if lvn.classification == "large" else 0.12
        ax.add_patch(
            Rectangle(
                (-1, float(lvn.low)),
                n + 2,
                float(lvn.high - lvn.low),
                facecolor=LVN_COLOR,
                edgecolor="none",
                alpha=alpha,
                zorder=1,
            )
        )

    _draw_candles(ax, candles)

    ax.axhline(float(profile.vah), color=CHART_VAH_VAL, linewidth=0.9,
               alpha=0.85, linestyle="--", zorder=3)
    ax.axhline(float(profile.poc), color=CHART_POC, linewidth=1.1, alpha=0.9, zorder=3)
    ax.axhline(float(profile.val), color=CHART_VAH_VAL, linewidth=0.9,
               alpha=0.85, linestyle="--", zorder=3)

    ax.text(n + 0.5, float(profile.vah), f" VAH {float(profile.vah):,.2f}",
            color=CHART_VAH_VAL, fontsize=9, va="center")
    ax.text(n + 0.5, float(profile.poc), f" POC {float(profile.poc):,.2f}",
            color=CHART_POC, fontsize=9, va="center")
    ax.text(n + 0.5, float(profile.val), f" VAL {float(profile.val):,.2f}",
            color=CHART_VAH_VAL, fontsize=9, va="center")

    n_ticks = 8
    step = max(n // n_ticks, 1)
    tick_idxs = list(range(0, n, step))
    ax.set_xticks(tick_idxs)
    ax.set_xticklabels(
        [candles[i].open_time.strftime("%m-%d %H:%M") for i in tick_idxs],
        rotation=30,
        ha="right",
        color=TEXT_SECONDARY,
    )

    ax.tick_params(axis="y", colors=TEXT_SECONDARY)
    for spine in ax.spines.values():
        spine.set_color(BORDER)
    ax.grid(True, color=GRID, linewidth=0.5, alpha=0.6)
    ax.set_xlim(-1, n + 12)

    n_large = sum(1 for lvn in lvns if lvn.classification == "large")
    n_small = sum(1 for lvn in lvns if lvn.classification == "small")
    title = (
        f"{symbol}  H1  ({n} bars)   "
        f"ATR(14)={float(atr):,.2f}   "
        f"LVNs={len(lvns)} ({n_large} large, {n_small} small)"
    )
    ax.set_title(title, color=TEXT_PRIMARY, fontsize=12, fontfamily="serif", pad=14)

    plt.tight_layout()
    fig.savefig(out_path, dpi=120, facecolor=fig.get_facecolor())
    plt.close(fig)


def main() -> int:
    parser = argparse.ArgumentParser(description="BTG Trader LVN inspector")
    parser.add_argument("--symbol", default="BTC/USDT:USDT")
    parser.add_argument("--days", type=int, default=30)
    parser.add_argument("--bars", type=int, default=None,
                        help="Override H1 bar count (default: days * 24)")
    parser.add_argument("--row-count", type=int, default=100)
    parser.add_argument("--extend-threshold", type=float, default=0.3)
    parser.add_argument("--atr-multiplier", type=float, default=1.5,
                        help="max_lvn_height = N * ATR_14")
    parser.add_argument("--polarity", choices=["bar", "pressure"], default="bar")
    parser.add_argument("--out", type=Path, default=Path("inspections"))
    args = parser.parse_args()

    bars = args.bars if args.bars is not None else args.days * 24
    args.out.mkdir(parents=True, exist_ok=True)

    print(f"Fetching {bars} H1 candles of {args.symbol} from Bybit...", flush=True)
    candles = fetch_h1(args.symbol, bars)
    if len(candles) < 50:
        print(f"ERROR: only got {len(candles)} candles; need >= 50.", file=sys.stderr)
        return 1
    print(
        f"  Got {len(candles)} candles "
        f"({candles[0].open_time.isoformat()} -> {candles[-1].close_time.isoformat()})"
    )

    print("Building Volume Profile...", flush=True)
    profile = build_volume_profile(
        candles, row_count=args.row_count, polarity_method=args.polarity
    )
    atr = compute_atr(candles, period=14)
    max_h = Decimal(str(args.atr_multiplier)) * atr

    raw_lvns = detect_lvns(
        profile.row_volume,
        profile.profile_low,
        profile.row_step,
        neighbor_pct=Decimal("0.07"),
        extend_threshold=Decimal(str(args.extend_threshold)),
        max_lvn_height=max_h,
    )
    lvns = classify_lvns(raw_lvns)

    stamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    safe = args.symbol.replace("/", "_").replace(":", "_")
    base = args.out / f"lvns_{safe}_{stamp}"

    payload: dict[str, Any] = {
        "symbol": args.symbol,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "bar_count": len(candles),
        "first_bar_open": candles[0].open_time.isoformat(),
        "last_bar_close": candles[-1].close_time.isoformat(),
        "row_count": args.row_count,
        "polarity_method": args.polarity,
        "extend_threshold": args.extend_threshold,
        "atr_multiplier": args.atr_multiplier,
        "atr_14": str(atr),
        "max_lvn_height": str(max_h),
        "profile": {
            "profile_low": str(profile.profile_low),
            "profile_high": str(profile.profile_high),
            "poc": str(profile.poc),
            "vah": str(profile.vah),
            "val": str(profile.val),
            "row_step": str(profile.row_step),
        },
        "lvns": [
            {
                "low": str(lvn.low),
                "high": str(lvn.high),
                "depth": str(lvn.depth),
                "classification": lvn.classification,
                "height_atr": str((lvn.high - lvn.low) / atr) if atr > 0 else None,
            }
            for lvn in lvns
        ],
    }
    json_path = base.with_suffix(".json")
    json_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(f"JSON:  {json_path}")

    png_path = base.with_suffix(".png")
    render_chart(candles, profile, lvns, atr, png_path, args.symbol)
    print(f"Chart: {png_path}")

    print()
    print(f"Profile range:    {profile.profile_low} -> {profile.profile_high}")
    print(f"POC:              {profile.poc}")
    print(f"VAH / VAL:        {profile.vah} / {profile.val}")
    print(f"ATR(14):          {atr}")
    print(f"max_lvn_height:   {max_h}")
    n_large = sum(1 for lvn in lvns if lvn.classification == "large")
    n_small = sum(1 for lvn in lvns if lvn.classification == "small")
    print(f"LVNs detected:    {len(lvns)} ({n_large} large, {n_small} small)")
    print()
    for i, lvn in enumerate(lvns):
        height_atr = float((lvn.high - lvn.low) / atr) if atr > 0 else 0.0
        print(
            f"  [{i:2d}] {lvn.classification:5s}  "
            f"{float(lvn.low):11,.2f} -> {float(lvn.high):11,.2f}  "
            f"depth={float(lvn.depth):.3f}  "
            f"height={height_atr:.2f} ATR"
        )

    return 0


if __name__ == "__main__":
    sys.exit(main())
