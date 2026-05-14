# BTG Trader

Non-custodial automated trading software for Bybit perpetual futures.
Runs the **H.D.L.X** (Hidden Distribution Level Execution) volume-profile
mean-reversion strategy.

This is a monorepo with two parts:

| Path | What | Stack |
|---|---|---|
| `apps/web/` | Marketing site, login, dashboard, settings, legal pages | Next.js 15 · TypeScript · Tailwind · lightweight-charts |
| `services/strategy-engine/` | Pure-functional strategy primitives | Python 3.11 · numpy · Decimal arithmetic |

Authoritative design and strategy docs are at the repo root:

- `WORK_PLAN.md` — strategic plan, roadmap, pricing, risk
- `CLAUDE_OPUS_PROMPT.md` — locked strategy rules, architecture, security model
- `DESIGN.md` — design system (institutional dark)
- `HDLX_VP.pine` — reference Pine Script for the indicator math

## Quick start (web)

```bash
cd apps/web
pnpm install
cp .env.example .env.local        # fill in Supabase keys when ready
pnpm dev
# → http://localhost:3000
```

## Quick start (strategy engine)

```bash
cd services/strategy-engine
python -m venv .venv
.venv/Scripts/Activate.ps1
pip install -e .[dev,inspect]
pytest -q
```

## Deploying

See [`DEPLOY.md`](./DEPLOY.md) for step-by-step Supabase + Vercel setup.

## Status

Pre-MVP. Locked decisions are in `WORK_PLAN.md` and `CLAUDE_OPUS_PROMPT.md`.
The strategy engine has the primitives implemented and 100 passing tests;
the next chunk is the engine process that connects to Bybit market data
and writes signals to Supabase.

## License

Proprietary. © Black Triangle Group. Not for redistribution.
