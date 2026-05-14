# BTG Trader — web app

Next.js 15 dashboard for BTG Trader. Hosts the marketing site, login,
authenticated dashboard, settings, and legal pages.

## Run locally

```bash
pnpm install
cp .env.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
pnpm dev
```

Visit http://localhost:3000.

The chart and ticker work without any Supabase configuration — they pull
live data from Bybit's public REST + WebSocket. Auth and persistence
require Supabase env vars.

## Routes

| Route | Purpose |
|---|---|
| `/` | Marketing landing |
| `/login` | Sign-in / sign-up |
| `/dashboard` | Authenticated user dashboard |
| `/strategy` | Locked strategy parameters + rule recap |
| `/trades` | Trade history |
| `/keys` | Bybit API key management |
| `/settings` | Risk caps, notifications, account, security |
| `/terms`, `/privacy`, `/risk-disclosure` | Legal (drafts) |

## Tech

- **Next.js 15** App Router · React 19
- **TypeScript** strict mode
- **Tailwind v3** with custom BTG token system (see `tailwind.config.ts`)
- **lightweight-charts** v5 for the candlestick chart
- **lucide-react** for stroke icons
- Next/font for Inter, Playfair Display, JetBrains Mono

## Deploying to Vercel

When importing this repo on Vercel, set:

- **Root directory:** `apps/web`
- **Framework preset:** Next.js (auto-detected)
- **Build command:** `pnpm build` (auto-detected)
- **Environment variables:** copy from `.env.example`

Every push to `main` will auto-deploy.

## Conventions

- No emoji in product UI
- No marketing language inside the product
- All numbers in `JetBrains Mono` with `tabular-nums`
- Page titles in `Playfair Display`; everything else `Inter`
- Red used sparingly — one primary CTA per screen
