# BTG Trader — Work Plan

**Project:** Black Triangle Group — Automated Crypto Trading SaaS
**Strategy:** H.D.L.X (Hidden Distribution Level Execution) on Bybit Perpetuals
**Document:** Founder-facing technical & strategic plan
**Status:** Pre-MVP, decisions locked, ready to build

---

## 1. Executive Summary

We are building a non-custodial automated trading SaaS that executes a Volume Profile / LVN-rejection mean-reversion strategy on Bybit perpetual futures, with the user retaining full custody of funds. The platform connects via the user's Bybit API key (trade + read permissions only, no withdraw). Signals are computed centrally per symbol and broadcast to all subscribed users; position sizing and execution are per-user.

Three deliverables in this plan:
1. **Honest analysis** of what the strategy can realistically achieve
2. **Architecture + 24-week phased roadmap** (MVP → Beta → Production)
3. **Operational scaffolding** (pricing, brand, regulatory posture, risks)

A separate file (`CLAUDE_OPUS_PROMPT.md`) contains the self-contained prompt to start the build in a fresh Opus / Claude Code session.

---

## 2. Honest Strategic Analysis

### 2.1 Win Rate Reality

The locked rule set is a clean LVN-rejection mean-reversion system with:
- Conservative entry filter (wick test + candle close + invalidation cancel)
- Tight stops (just outside the LVN box)
- Multi-level distance-weighted partials
- Runner to the far-side LVN extreme

This is a **sound strategy archetype.** Realistic expectations:

| Metric | Realistic Range | Notes |
|---|---|---|
| Win rate | **55–65%** | Higher only with aggressive filters that cut frequency to 3–8 trades/month |
| Avg R:R | **1.5–2.5** | Partials lock profit early; runner provides positive skew |
| Trades/month per symbol | **8–20** on H1 | Depends on volatility regime and LVN density |
| Max drawdown | **15–25%** | Typical for futures mean-reversion |
| Sharpe ratio | **1.0–1.8** if executed well | The target metric, not WR |

**80% win rate is not a realistic target on H1 crypto.** Strategies that report 80%+ WR in marketing almost always have unfavorable R:R (e.g., risking 5R to make 0.5R), or are backtest-overfit and decay forward. The math: a strategy with 60% WR and 2.0 R:R has the same expected value as one with 85% WR and 0.5 R:R — but the former is far more robust to single-trade variance.

**Recommendation:** Position the product around **risk-adjusted returns (Sharpe), monthly EV consistency, and drawdown control** — not raw win rate. Show users the equity curve and Sharpe, not a "WR %" billboard.

### 2.2 Backtest-Forward Decay

Expect 20–40% degradation between backtest and live. Why:
- Slippage on illiquid LVN edges (real fills are worse than mid-price assumptions)
- Funding rates on perpetuals (accumulate against you on held positions)
- Network latency between signal compute and exchange execution
- Bybit maintenance windows and rare API throttling

This decay is **why we mandate ≥60 days of paper trading before any user goes live.**

### 2.3 The Strategy Engine Is the Project

The Pine Script renders an *information layer* (Volume Profile + HDLX oscillator). It does not contain a strategy in the algorithmic sense — the strategy rules (entry on LVN test, partials sequence, invalidation) live in our discussion, not in the script. **Coding the strategy is the largest, hardest, and most consequential part of this build.** Expect 4–6 weeks of pure strategy-engine work in MVP, including unit tests and historical validation.

---

## 3. Locked Strategy Specification

This is the authoritative rule set agreed during planning. The Pine Script is *reference* for the Volume Profile / HDLX math; the rules below are *authoritative* for execution.

### 3.1 Market & Timeframe
- **Exchange:** Bybit (Perpetual Futures)
- **Symbols (MVP):** BTCUSDT.P, ETHUSDT.P
- **Trading timeframe:** H1 (1-hour candles)
- **VP calculation window:** Rolling 5,000 H1 bars (~7 months) — provides deep auction map, filters noise, focuses on long-term LVN levels
- **Direction:** Both Long and Short, no HTF trend filter (LVN structure does the work)

### 3.2 LVN Detection
- Profile divided into 100 rows over the 5,000-bar window
- LVN = volume gap detected with Node Detection 7% (matches indicator default)
- Each detected LVN forms a *box* with high/low boundaries
- LVNs are classified as **large** or **small** by relative volume gap depth
- User toggles in settings: `Focus on Large LVNs only` / `Focus on Small LVNs only` / `Both` (default: Both)

### 3.3 Entry Trigger (Short Setup; mirror for Long)
1. Price rallies into an LVN box from below
2. **A single H1 candle wicks into the LVN box** (wick high ≥ LVN low)
3. **The same candle closes outside the LVN box** (close < LVN low) → confirms rejection
4. **Entry order placed at the open of the next H1 candle** (market order with slippage guard)

### 3.4 Invalidation (Pre-Entry)
- If between wick and close, the candle **closes inside or above the LVN box**, setup is *invalidated* — no entry
- Setting toggle: `Single-bar confirmation` (default) | `Two-bar confirmation` (filter: requires next bar also to confirm)
- After invalidation, the bot immediately evaluates the next LVN in the queue

### 3.5 Stop Loss
- Placed at `LVN_high + 0.5 × ATR(14)` (short) / `LVN_low − 0.5 × ATR(14)` (long)
- Minimum SL distance enforced: `max(0.5 × ATR, 0.15% of price)` to avoid noise stops
- After Partial 1 fills → SL moves to **break-even** (entry price)
- After each subsequent partial → SL trails to the previous partial's level

### 3.6 Take Profit (Distance-Weighted Partials)
Targets are constructed dynamically per trade based on the levels between entry and the far-side LVN extreme:
- **TP levels in order:** closest LVN → VAH → POC → VAL → any intermediate LVN → far-side LVN extreme (runner)
- **Position size at each TP:** proportional to R-distance.
  - Formula: `size_i = R_i / Σ R_j` where `R_i` is the R-multiple of TP_i
  - Worked example: TPs at 1R / 2R / 3R / 4R / 5R → sizes 7% / 13% / 20% / 27% / 33%
- This is naturally back-loaded — runner gets the largest tranche

### 3.7 Re-Entry & Cluster Rules
- **After SL hit on a given LVN:** bot may re-enter on the next valid test of the *same* LVN, max **2 entries per LVN**, then the LVN is dormant until VP recomputes
- **After invalidation (no entry occurred):** bot moves immediately to the next LVN in queue, no cooldown
- **LVN cluster** (multiple LVNs within 0.5 × ATR): the user toggle (large/small/both) handles selection

### 3.8 Roadmap v2 (Not MVP)
**Trend Continuation Override** — if an intermediate partial-target LVN fails to reject price (price slices through without bouncing), the bot holds (skips the partial) under the principle "Value Failed to Rotate → Trend Continuation." Adds significant complexity; deferred to v2.

---

## 4. Architecture

### 4.1 High-Level Design

```
┌─────────────────────────────────────────────────────────────┐
│                       USER LAYER                             │
│  Next.js (web) — Dashboard, settings, billing, history      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    API LAYER (Node.js + Fastify)             │
│  Auth (Supabase) │ Billing (Paddle) │ User config │ History │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
   ┌────────────────┐ ┌──────────────┐ ┌──────────────┐
   │   PostgreSQL   │ │     Redis    │ │  AWS KMS     │
   │  (Supabase)    │ │   (Upstash)  │ │ (API keys)   │
   └────────────────┘ └──────────────┘ └──────────────┘
                              ▲
                              │
┌─────────────────────────────────────────────────────────────┐
│              STRATEGY ENGINE (Python)                        │
│   • Market data ingest (Bybit WebSocket + REST)              │
│   • VP + HDLX computation per symbol                         │
│   • Signal evaluation against locked rule set                │
│   • Publishes signals to Redis pub/sub                       │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │
┌─────────────────────────────────────────────────────────────┐
│           EXECUTION WORKERS (Node.js + BullMQ)               │
│   • Subscribes to signal channel                             │
│   • Per-user: position sizing, leverage, risk caps           │
│   • Submits orders to user's Bybit account via API           │
│   • Manages SL/TP, partials, trailing                        │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Master Signal Pattern

**One signal computation per symbol, broadcast to all users.** Volume profile and HDLX are deterministic functions of price+volume data — they're identical for every user on the same symbol. Computing per-user wastes 99% of compute and creates inconsistency between users on the same signal.

Per-user variation happens only at:
- Position sizing (account balance × risk %)
- Tier eligibility (Free/Pro/Max/Ultra limits)
- Leverage selection (user-set within global cap)
- Symbol subscription (which symbols this user opted into)

### 4.3 Security Model (API Keys)

**Threat model:** API keys for trading are nearly as dangerous as funds themselves if leaked. The platform must never lose a key, never log a key, never expose a key in error traces.

Controls:
1. User generates Bybit API key **client-side** with explicit Bybit permissions `Read + Trade`, **never** `Withdraw`
2. Key+secret encrypted client-side with a server-issued public key, transmitted, then re-encrypted server-side via **AWS KMS envelope encryption**
3. KMS data key is decrypted **per-request, in-memory** by execution workers; never logged
4. Audit log records every key access with worker ID, timestamp, action (no key content)
5. Key rotation reminders every 90 days
6. On user offboard / subscription cancellation → keys are crypto-shredded (KMS key deleted)
7. **Withdraw permission detected → API connection rejected with clear UI error**

### 4.4 Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js 15 + TypeScript + Tailwind + shadcn/ui | Fastest path to professional dashboard, full SSR/CSR, huge ecosystem |
| Backend API | Node.js + Fastify | Lightweight, fast, fits Next.js mental model |
| Strategy engine | Python 3.12 + pandas + numpy + ccxt | Industry standard for quant; ccxt for exchange-agnostic future-proofing |
| DB | PostgreSQL via Supabase | Managed Postgres + auth + row-level security baked in |
| Cache + Queue | Redis via Upstash (cache) + BullMQ (job queue) | Battle-tested, serverless-friendly |
| Auth | Supabase Auth | Google SSO out-of-box, JWT-based, free up to 50k MAU |
| Secrets | AWS KMS | Industry standard for envelope encryption |
| Hosting | Hetzner VPS (€10–30/mo) for engine + workers; Vercel for Next.js | Cheap, simple, scalable. Avoid AWS for solo-dev complexity |
| Monitoring | Sentry (errors) + Better Stack (uptime + logs) | Generous free tiers |
| Payments | Paddle (Merchant of Record) | Handles VAT, friendlier to crypto-adjacent vs. Stripe |
| i18n | next-intl | English + Russian baked in |

### 4.5 Critical Design Decisions

1. **Strategy engine in Python, not TypeScript.** Quant libraries are far stronger in Python; debugging numpy beats hand-rolling math in TS.
2. **Stateless signal compute, stateful position management.** Engine emits signals; workers own positions. Clean separation.
3. **Idempotent order submission.** Every order carries a deterministic `clientOrderId` derived from `(userId, signalId, partialIndex)`. Retries cannot double-fill.
4. **Heartbeat-based liveness.** Engine emits heartbeat every 10s; if missing for 60s, all execution workers refuse to act on new signals (fail-safe over fail-active).
5. **No floats for money.** All position sizes and prices stored as `decimal.Decimal` (Python) / `bigint` (TS).

---

## 5. Phased Delivery (24-Week Roadmap)

### Phase 1 — MVP (Weeks 1–8)
**Goal:** Working paper trading on BTCUSDT.P only, fully observable.

Scope:
- Auth (Supabase + Google SSO)
- Bybit API key onboarding (encrypted, validated for correct permissions)
- Strategy engine: VP + HDLX + locked rule set, BTC only, H1 only
- Paper trading mode only (live mode toggle exists but locked)
- Basic dashboard: live signal status, paper P&L, signal history
- Backtest runner (CLI, results to JSON) for internal validation
- Sentry + uptime monitoring

**Exit criteria:**
- 30 consecutive days of paper signals with no exceptions or order desyncs
- Backtest on 2 years of BTC H1 data produces consistent results across walk-forward windows
- Strategy engine has ≥80% test coverage, including edge cases (gap candles, missing data, API timeout)

### Phase 2 — Beta (Weeks 9–16)
**Goal:** Live trading with first paying users, ETH added.

Scope:
- Live trading mode unlock (gated by minimum 60-day successful paper run per user)
- ETH added to symbol list
- Paddle billing integration (4 tiers)
- Email notifications (signal entry, SL hit, daily summary)
- i18n: English + Russian (UI, emails, ToS, Privacy)
- Telegram bot for signal alerts (read-only)
- Improved dashboard: equity curve, trade history with annotations, performance metrics (WR, Sharpe, max DD)
- Invite-only launch: target 20–50 paying users

**Exit criteria:**
- ≥10 users running live for ≥30 days each without platform-caused incidents
- Real-world strategy performance within ±25% of backtest expectations (slippage etc.)
- Zero API key incidents

### Phase 3 — Production (Weeks 17–24)
**Goal:** Public launch, top-10 assets, full feature set.

Scope:
- Top-10 symbol expansion (rolling: SOL, BNB, XRP, DOGE, ADA, AVAX, LINK, MATIC added)
- Trend Continuation Override (v2 logic)
- Advanced risk settings (per-symbol caps, daily loss limit, drawdown circuit breaker)
- Mobile-responsive dashboard
- Onboarding flow with paper-mode requirement and educational content
- Public marketing site
- Referral program

**Exit criteria:**
- 100+ paying users
- 99.9% uptime over rolling 90 days
- Strategy real-world Sharpe ≥1.0 across user cohort

### Beyond Production (v3 / future)
- Additional exchanges (Binance, Bitget, OKX) via ccxt abstraction
- Multi-strategy support (users select from library)
- Strategy marketplace (other quants publish strategies)
- White-label / API access for institutional users
- Mobile apps (React Native)
- Regulatory licensing in chosen jurisdiction

---

## 6. Strategy Engine: Pine Script → Python

The Pine Script is reference for the math. Direct translation is unsafe because:
- Pine arrays use 1-indexed conventions in places; numpy is 0-indexed
- Pine `request.security_lower_tf` returns aggregated data; in Python we work from raw lower-TF data directly
- Pine's `barstate.islast` model doesn't apply — Python engine is event-driven on bar close

**Translation plan:**
1. Build VP/HDLX as pure functions: `compute_volume_profile(ohlcv_df, lookback_bars, num_rows) → ProfileResult` with fields `vah, val, poc, lvn_boxes[], hdlx_series[]`
2. Build LVN classification function: `classify_lvns(profile, atr) → list[LVN]` with `size` (large/small), `position` (above/below current price), `volume_gap_depth`
3. Build entry evaluator: `evaluate_entry(candle, lvns, settings) → Signal | None`
4. Build position manager: `PositionManager` class that owns SL, partials, trailing for active positions
5. Unit test every function against fixed historical fixtures (known LVN dates + expected signals)

**Backtest framework:** vectorbt or custom event-driven loop. Custom loop preferred — more readable for strategy debugging, lets us simulate exact execution sequence including partials.

---

## 7. Backtest + Paper Trading Methodology

### 7.1 Backtest
- **Data:** 3 years of BTC + ETH H1 from Bybit historical API (already free)
- **Walk-forward:** 6-month training, 1-month out-of-sample, rolling
- **No optimization on out-of-sample windows** — parameters frozen, only evaluated
- **Slippage model:** 5 bps on entry, 5 bps on exit (conservative for H1 BTC/ETH)
- **Funding cost:** subtract realized funding from P&L on held positions
- **Metrics reported:** total return, Sharpe, Sortino, max DD, WR, avg R:R, expectancy per trade, average trade duration

### 7.2 Paper Trading (Per User, Mandatory)
- Every new user must run ≥60 days of paper trading before live mode unlocks
- Paper uses **identical signal pipeline**, simulated fills at next-bar open with slippage applied
- Paper P&L shown alongside what live P&L *would* have been
- After 60 days: dashboard shows actual paper Sharpe + WR + max DD; user must explicitly acknowledge before live unlocks

### 7.3 Live Cohort Monitoring
Once live, internal dashboard tracks aggregate cohort Sharpe, WR, max DD. Any drift >2σ from expected → trigger investigation (regime change vs. bug).

---

## 8. Pricing

Your proposed tiers focus on trade count. That works as a differentiator but I recommend complementing with capability differentiation, because the *cost to platform* of an extra trade is near-zero (signal already computed; execution is one API call). Differentiating by features and capital limits creates clearer upgrade reasons.

**Recommended tier structure:**

| Tier | Price | Trades / mo | Symbols | Strategies | Other |
|---|---|---|---|---|---|
| **Trial** | $0 | 5 (lifetime) | BTC only | Paper only | 14-day window |
| **Starter** | **$29 / mo** | 25 | BTC + ETH | 1 (HDLX) | Live trading, email alerts |
| **Pro** | **$79 / mo** | 75 | Top-5 | 1 (HDLX) | + Telegram alerts, custom risk settings |
| **Max** | **$199 / mo** | 200 | Top-10 | 1 (HDLX) | + priority signal feed, advanced analytics, multi-account |
| **Ultra** | **$499 / mo** | Unlimited | All | All available | + API access, dedicated support |

**Rationale:**
- **Trial at 5 trades is too short to evaluate** a strategy that produces 8–20 trades/month per symbol. 14-day window with paper-only mode lets users see ≥10 paper signals before deciding.
- **Starter $29** sits at the impulse-buy threshold for retail crypto traders; clears the cost of a Netflix subscription mentally.
- **Pro $79** is the workhorse tier where most users land — 75 trades/month aligns with 2–3 active symbols, the realistic limit for users to monitor.
- **Max $199** targets prosumer / small-fund users who want top-10 coverage and multi-account.
- **Ultra $499** is the prosumer/team tier. Keeps an "unlimited" SKU available without flat $-per-trade billing complexity.

**Notes:**
- You proposed Pro ≥ $20. $29 is closer to industry comparables (3Commas, Cryptohopper start $14–37/mo, but they don't include a real strategy — they're just bot frameworks).
- Annual billing 20% discount → reduces churn, predictable revenue.
- All tiers must include the **"non-custodial, your keys, your coins"** disclaimer in the upgrade flow.

---

## 9. Brand & Design

### 9.1 Brand
- **Parent brand:** Black Triangle Group (BTG)
- **Product name candidates** (in priority order):
  1. **BTG Trader** — most literal, immediate brand alignment
  2. **Apex by BTG** — references the triangle apex; "apex predator" / "peak performance" connotations
  3. **Vertex by BTG** — geometric, sounds technical
  4. **Trigon** — Greek for triangle, short, ownable
  5. **BTG Sentinel** — emphasizes the defensive / risk-managed nature

My recommendation: **Apex by BTG.** Triangle motif is reinforced, name suggests precision/peak, available as `.com` / `.io` likely, works in EN and RU.

### 9.2 Design System (BTG-Aligned)

Based on your logo (black field, red rising arrow, ETH/BTC symbols, serif "Black Triangle" wordmark):

| Token | Value | Usage |
|---|---|---|
| `--bg-primary` | `#0A0A0B` | Main background |
| `--bg-elevated` | `#15151A` | Card / panel background |
| `--bg-overlay` | `#1F1F26` | Modal / popover background |
| `--accent-primary` | `#DC2626` | CTAs, active states, positive direction signals (matches logo red) |
| `--accent-glow` | `#EF4444` | Hover states, highlights |
| `--text-primary` | `#F5F5F7` | Body text |
| `--text-secondary` | `#A1A1AA` | Labels, metadata |
| `--text-muted` | `#52525B` | Disabled, hints |
| `--border-subtle` | `#27272A` | Card borders |
| `--success` | `#16A34A` | P&L positive (used sparingly) |
| `--danger` | `#DC2626` | P&L negative, SL hit, errors |
| `--chart-up` | `#26A69A` | Bullish candles (matches Pine indicator) |
| `--chart-down` | `#EF5350` | Bearish candles (matches Pine indicator) |

**Typography:**
- Headings: serif (e.g., `Playfair Display` or `Source Serif Pro`) — matches "Black Triangle" wordmark
- Body: `Inter` — neutral, professional, multilingual
- Numbers / prices: `JetBrains Mono` — tabular figures, locks columns

**Motif:** Triangle silhouettes as background watermarks in onboarding, empty states, and email headers. Subtle, never loud.

**Tone:** Institutional. Avoid emoji, avoid casual language ("Let's go!" → "Activate"), avoid gimmicks. Aim for the visual register of Bloomberg Terminal × Linear.app.

---

## 10. Regulatory Roadmap (Deferred)

You stated regulation is post-MVP / post-strategy-validation. Accepted. Below is the minimum bookkeeping so v3 doesn't require a rewrite:

| Decision | MVP Default | Why |
|---|---|---|
| Custody | Non-custodial (user keys, user funds) | Avoids VASP licensing in most jurisdictions |
| API permissions | `Read + Trade` only, never `Withdraw` | Even if platform is compromised, no funds can leave |
| Positioning | "Software tool" not "investment service" | Reduces investment-advisor exposure |
| US users | Excluded via Cloudflare geo-block | US regulatory complexity (SEC, CFTC) deferred |
| Disclaimers | Aggressive: signup, before live unlock, before every strategy activation, in dashboard footer | Standard "not financial advice, past performance, can lose all capital" |
| Data | GDPR-compliant by default (Supabase EU region, deletion API, no marketing without consent) | Cheap to do right from day 1 |
| ToS / Privacy / Risk Disclosure | Drafted by lawyer before public Beta, not before paper-only MVP | Cost-defer |

**When to revisit:** When monthly platform revenue > $20k or you're approached by an institutional customer. At that point, retain a fintech lawyer in your chosen jurisdiction. Likely options: Estonia (e-Residency + clear crypto framework), UAE / RAK DAO (VASP-friendly), Cayman / BVI (offshore), or Switzerland (institutional reputation). **Avoid US unless you're prepared for a $250k+/year compliance burden.**

---

## 11. Risks & Open Questions

### Top Risks (in order of impact)

1. **Strategy decay.** Live performance significantly underperforms backtest. *Mitigation:* mandatory 60-day paper trading per user; cohort monitoring; transparent reporting of live vs. paper P&L on dashboard.

2. **API key incident.** Compromised keys → users lose funds. *Mitigation:* KMS envelope encryption; no logging of keys; Withdraw-permission rejected at onboarding; quarterly security audit budget (~$10k once in Beta).

3. **Bybit API instability.** Outages or rate-limit changes break execution. *Mitigation:* ccxt abstraction layer means we can route to Binance/OKX with limited engineering work; status-page integration; heartbeat-based fail-safe.

4. **Slippage on LVN setups.** LVN edges are often illiquid by definition (low-volume nodes). Real fills may be much worse than mid-price assumptions. *Mitigation:* execution uses post-only limit orders where possible; conservative backtest slippage model (5 bps); real-time slippage monitoring with alerts.

5. **Regulatory shift.** Bybit gets restricted in a major user-jurisdiction. *Mitigation:* multi-exchange roadmap; geo-targeting in onboarding.

6. **Founder bandwidth.** Solo founder + AI tooling is workable for MVP but not Production. *Mitigation:* budget for first hire (junior engineer or technical co-founder) at Beta-stage success.

### Open Questions for You

These don't block the build but will need answers before public launch:
- Pricing tier names — keep my proposed names (Trial/Starter/Pro/Max/Ultra) or rebrand?
- Domain — do you own a domain already? If not, I'll suggest `apexbybtg.com` or `btgtrader.io` candidates.
- Support model for paying users — email-only, or live chat (Intercom/Crisp)?
- First hire criteria — when does revenue justify bringing on a second engineer?

---

## 12. Next Steps

1. **Open the file `CLAUDE_OPUS_PROMPT.md`** in this session and copy its full contents
2. **Open a new Claude Opus 4.7 chat or Claude Code session**
3. **Paste the prompt as the first message**
4. **Have the Pine Script file ready** to share when Opus asks for it
5. **Have a fresh GitHub repo created** (private) named `btg-trader` (or final brand choice)

The prompt is structured so the new session can begin coding immediately on Week-1 MVP tasks (strategy engine bootstrap), with all context pre-loaded.

— End of Work Plan —
