# BTG Trader — Design System

**Brand:** Black Triangle Group (BTG)
**Product:** BTG Trader / Apex by BTG
**Aesthetic:** Institutional dark, geometric precision, restrained luxury
**Reference:** Bloomberg Terminal × Linear.app × Phantom Wallet

---

## 1. Brand Identity

### 1.1 Visual Language
The BTG logo establishes a clear visual grammar that the product must honor:

- **Pure black field** — confidence, focus, no decoration for its own sake
- **Solid geometric triangle** (apex up) — direction, structure, ascension
- **Red rising arrow** — singular accent, signals momentum and execution
- **Subtle crypto symbols** (ETH, BTC) — domain authority without overstating it
- **Serif wordmark in silver/grey** — institutional, considered, not "tech bro"

The entire product should feel like the logo: **mostly dark space, with one thing demanding your attention at a time.**

### 1.2 Tone of Voice
| ✅ Do | ❌ Don't |
|---|---|
| "Position opened at 67,420.5" | "Position opened! 🚀" |
| "Activate strategy" | "Let's go!" |
| "Live signal feed" | "Awesome trades coming your way" |
| "Equity curve" | "Your profit journey" |
| Precise, declarative, professional | Cheerful, casual, gamified |

No emoji in product UI. No exclamation marks except in error states. No marketing fluff in the dashboard.

---

## 2. Color System

### 2.1 Foundation Colors

```css
:root {
  /* Backgrounds — derived from logo black field */
  --bg-base:       #000000;  /* App shell, body, page background */
  --bg-surface:    #0A0A0B;  /* Default surface (cards, panels) */
  --bg-elevated:   #15151A;  /* Elevated surface (hover, dropdowns) */
  --bg-overlay:    #1F1F26;  /* Modals, popovers, command palette */
  --bg-input:      #0D0D10;  /* Form inputs */

  /* Borders — barely-there structure */
  --border-subtle:  #1F1F24;  /* Default card border */
  --border-default: #27272A;  /* Input border */
  --border-strong:  #3F3F46;  /* Focus ring outer */
  --border-divider: #15151A;  /* Section dividers */

  /* Text — silver/white hierarchy */
  --text-primary:   #F5F5F7;  /* Headings, key numbers, body emphasis */
  --text-secondary: #A1A1AA;  /* Labels, metadata, helper text */
  --text-tertiary:  #71717A;  /* Captions, timestamps */
  --text-muted:     #52525B;  /* Disabled, placeholder */
  --text-inverse:   #0A0A0B;  /* On light accent backgrounds (rare) */

  /* Accent — the BTG red, used SPARINGLY */
  --accent:         #DC2626;  /* Primary CTAs, active state, BUY direction */
  --accent-hover:   #EF4444;  /* Hover on accent */
  --accent-glow:    rgba(220, 38, 38, 0.15); /* Box-shadow glows */
  --accent-bg:      rgba(220, 38, 38, 0.08); /* Subtle backgrounds */

  /* Semantic — trading-aware */
  --success:        #22C55E;  /* Positive P&L, filled orders */
  --success-bg:     rgba(34, 197, 94, 0.08);
  --danger:         #DC2626;  /* Same as accent — SL hit, losses, SELL */
  --danger-bg:      rgba(220, 38, 38, 0.08);
  --warning:        #F59E0B;  /* Pending, paper mode notice */
  --warning-bg:     rgba(245, 158, 11, 0.08);
  --info:           #3B82F6;  /* Informational notices */

  /* Chart-specific (matching Pine indicator conventions) */
  --chart-up:       #26A69A;  /* Bullish candles */
  --chart-down:     #EF5350;  /* Bearish candles */
  --chart-volume:   #3F3F46;  /* Volume bars */
  --chart-grid:     #18181B;  /* Chart gridlines */
  --chart-vah:      #2962FF;  /* Value Area High/Low — matches Pine */
  --chart-poc:      #F44336;  /* Point of Control */
  --chart-lvn:      #FF9800;  /* LVN gap markers */
}
```

### 2.2 Color Usage Rules

1. **Red is rare.** It marks one CTA per screen at most, plus losses/SL/SELL direction. Multiple red elements on a screen creates visual noise — defeats the logo's "one focal point" principle.
2. **Green is even rarer.** Reserved for filled-position success states and positive P&L numbers. Never use for navigation, buttons, or general affirmation.
3. **Text follows a strict 4-step hierarchy.** No "almost primary, almost secondary" greys — only the four declared tokens.
4. **Background gradient is forbidden.** Flat black surfaces only. No vignettes, no gradients, no glassmorphism blur. The logo is flat — the product is flat.
5. **One exception:** subtle accent-color glow on focus rings and active CTAs is allowed (mimics the logo arrow's energy).

### 2.3 Light Mode
**There is no light mode.** BTG is a dark-only product. This is a brand choice, not laziness. Document it in onboarding: *"BTG Trader is engineered for low-light, long-session focus. No light theme."*

---

## 3. Typography

### 3.1 Type Stack

```css
:root {
  --font-display: 'Playfair Display', 'Source Serif Pro', Georgia, serif;
  --font-sans:    'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono:    'JetBrains Mono', 'SF Mono', 'Cascadia Code', monospace;
}
```

| Font | Usage | Why |
|---|---|---|
| **Playfair Display** (serif) | Page titles, dashboard heading, marketing site H1/H2 | Echoes the "BLACK TRIANGLE" wordmark in the logo — institutional, considered |
| **Inter** (sans) | All body, UI labels, buttons, navigation | Neutral, multilingual (RU + EN), proven at small sizes |
| **JetBrains Mono** (mono) | All prices, P&L numbers, timestamps, hashes, API keys | Tabular figures lock columns; you can compare prices vertically without slop |

### 3.2 Scale & Hierarchy

```css
/* Display — page titles, hero text */
--text-display-lg: 48px / 56px / 700 / -0.02em;   /* size / line / weight / tracking */
--text-display-md: 36px / 44px / 700 / -0.02em;
--text-display-sm: 28px / 36px / 600 / -0.01em;

/* Headings — section titles */
--text-h1: 24px / 32px / 600 / -0.01em;
--text-h2: 20px / 28px / 600 / -0.01em;
--text-h3: 16px / 24px / 600 / 0;
--text-h4: 14px / 20px / 600 / 0.01em;  /* UPPERCASE label style */

/* Body */
--text-body-lg: 16px / 24px / 400 / 0;
--text-body:    14px / 20px / 400 / 0;   /* Default UI text */
--text-body-sm: 13px / 18px / 400 / 0;

/* Mono — for numbers */
--text-mono-lg: 24px / 32px / 500 / 0;   /* Large P&L, position size */
--text-mono:    14px / 20px / 500 / 0;   /* Prices in tables */
--text-mono-sm: 12px / 16px / 500 / 0;   /* Timestamps, IDs */
```

### 3.3 Typography Rules

1. **Numbers always in mono.** Prices, P&L, percentages, position sizes, ATR, ticks — always JetBrains Mono with `font-variant-numeric: tabular-nums`.
2. **Serif is reserved for page titles only.** Never use Playfair Display for buttons, navigation, or body text. It signals "this is the title of the page."
3. **No font weights below 400 or above 700.** No 300-weight body text (illegible on dark), no 800-weight headings (gimmicky).
4. **Russian rendering verified.** Inter and JetBrains Mono both have full Cyrillic support. Playfair Display has Cyrillic in modern weights — confirm at build time.
5. **No italics in UI.** Italics are reserved for inline emphasis in marketing copy or legal text. Never in the dashboard.

---

## 4. Spacing & Layout

### 4.1 Spatial Grid

Base unit: **4px.** All spacing is a multiple of 4.

```css
--space-1:  4px;
--space-2:  8px;
--space-3:  12px;
--space-4:  16px;
--space-5:  20px;
--space-6:  24px;
--space-8:  32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
--space-20: 80px;
--space-24: 96px;
```

### 4.2 Layout Patterns

**Dashboard width:** Centered max-width `1440px` content area with `48px` outer gutters at desktop, `16px` at mobile.

**Sidebar:** Fixed left, `240px` wide on desktop, collapsible to `64px` icon-only. Items stacked top-to-bottom with `8px` vertical spacing. Section dividers use `--border-divider`.

**Top bar:** `56px` height. Holds account selector, paper/live toggle, notifications bell, user menu. Sticky on scroll.

**Cards:** `border-radius: 8px` (sharp, not rounded — geometric). Padding `24px` standard, `16px` for dense data tables.

**Grid system:** 12-column at desktop with `24px` gutters. 4-column at mobile.

### 4.3 Negative Space Doctrine

Air is the design. Default to *more* spacing, not less. Cramped trading dashboards look amateur. Use the logo as the mental model: the triangle is small relative to the black field — most of the surface is empty.

---

## 5. Components

### 5.1 Buttons

**Primary** — used once per screen for the most important action.

```css
.btn-primary {
  background: var(--accent);
  color: white;
  font-family: var(--font-sans);
  font-size: 14px;
  font-weight: 600;
  padding: 10px 20px;
  border-radius: 6px;
  border: none;
  letter-spacing: 0.01em;
  transition: all 150ms ease;
}
.btn-primary:hover {
  background: var(--accent-hover);
  box-shadow: 0 0 0 4px var(--accent-glow);
}
.btn-primary:active {
  transform: scale(0.98);
}
```

**Secondary** — outline style for non-destructive actions.

```css
.btn-secondary {
  background: transparent;
  color: var(--text-primary);
  border: 1px solid var(--border-default);
  /* same padding, font, transitions */
}
.btn-secondary:hover {
  background: var(--bg-elevated);
  border-color: var(--border-strong);
}
```

**Tertiary / Ghost** — text-only for low-emphasis actions ("Cancel", "Skip").

**Danger** — red but inverted to communicate destructive vs. primary. Used for "Close Position", "Revoke API Key", "Delete Account".

```css
.btn-danger {
  background: transparent;
  color: var(--danger);
  border: 1px solid rgba(220, 38, 38, 0.3);
}
.btn-danger:hover {
  background: var(--danger-bg);
  border-color: var(--danger);
}
```

### 5.2 Cards

```css
.card {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: var(--space-6);
}
.card-header {
  border-bottom: 1px solid var(--border-divider);
  padding-bottom: var(--space-4);
  margin-bottom: var(--space-4);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.card-title {
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
}
```

Card titles are **uppercase, tracked, 14px, secondary-color** — institutional spreadsheet aesthetic. Numbers and content inside the card are full primary-color and full size.

### 5.3 Data Tables

This is the workhorse component. Trade history, position list, signal log — all tables.

```css
.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.table th {
  text-align: left;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-tertiary);
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-divider);
  background: transparent;
}
.table td {
  padding: 14px 16px;
  border-bottom: 1px solid var(--border-divider);
  color: var(--text-primary);
}
.table td.numeric {
  font-family: var(--font-mono);
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.table tr:hover td {
  background: var(--bg-elevated);
}
.table tr.row-positive td.numeric.pnl { color: var(--success); }
.table tr.row-negative td.numeric.pnl { color: var(--danger); }
```

### 5.4 Inputs

```css
.input {
  background: var(--bg-input);
  border: 1px solid var(--border-default);
  border-radius: 6px;
  padding: 10px 14px;
  color: var(--text-primary);
  font-family: var(--font-sans);
  font-size: 14px;
  transition: border-color 150ms ease, box-shadow 150ms ease;
}
.input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-glow);
}
.input::placeholder {
  color: var(--text-muted);
}
```

For numeric inputs (price, position size): use mono font and right-align text.

### 5.5 Status Badges

For position status, signal status, subscription tier:

```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-radius: 4px;
  border: 1px solid;
}
.badge-live   { color: var(--success); background: var(--success-bg); border-color: rgba(34,197,94,0.2); }
.badge-paper  { color: var(--warning); background: var(--warning-bg); border-color: rgba(245,158,11,0.2); }
.badge-closed { color: var(--text-tertiary); background: var(--bg-elevated); border-color: var(--border-subtle); }
```

Add a pulsing dot to `badge-live` (subtle, 2s cycle) — signals real-time activity.

### 5.6 Chart Panel

The TradingView chart embed is the dashboard centerpiece. Frame it in the BTG aesthetic:

- Background: `var(--bg-surface)`, not the default TV white
- Use Pine indicator colors as documented (matches the strategy visually)
- 1px `var(--border-subtle)` frame
- No drop shadow, no rounded corners on the chart itself — only on its container card
- Overlay the BTG triangle watermark in bottom-right, 8% opacity

---

## 6. Iconography

### 6.1 Style
- **Stroke icons only**, never filled. Stroke width 1.5px. Matches geometric precision of the triangle logo.
- **Library:** Lucide (Lucide React for the Next.js app). Consistent stroke style, large library, MIT-licensed.
- **Size scale:** 14px, 16px, 20px, 24px. Default to 16px in UI.
- **Color:** inherits `currentColor` from parent text token.
- **No emoji.** Use proper icons everywhere — including for status indicators.

### 6.2 Custom Iconography
The BTG triangle should appear as a brand mark in:
- Auth screens (large, centered, before logo wordmark)
- Empty states (e.g., "No trades yet" — triangle silhouette, 96px, `var(--text-muted)`)
- Loading states (subtle triangle outline, pulsing)
- Email signatures
- Favicon

Render the triangle as SVG with crisp geometry. No bevel, no shadow, no gradient.

---

## 7. Motion

### 7.1 Principles
- **Subtle, never showy.** Animation exists to confirm action and ground state change, not to entertain.
- **Default duration:** 150ms for micro-interactions (hover, focus), 250ms for transitions (panel open, route change).
- **Easing:** `ease` for entering, `ease-out` for exiting. No spring physics, no bounces.
- **Reduce motion respect:** honor `prefers-reduced-motion: reduce` — disable all non-essential transitions.

### 7.2 Specific Patterns

| Action | Animation |
|---|---|
| Hover button | Background color + glow shadow, 150ms |
| Focus input | Border color + glow ring, 150ms |
| Modal open | Backdrop fade-in 200ms, content fade + 4px translate-up 250ms |
| Toast notification | Slide in from top-right, 300ms; auto-dismiss 4s; slide out 200ms |
| New trade row appears | Background flash `--accent-bg` for 1.2s, then settle |
| Position P&L updates | Number "ticker" animation — old digit slides up, new digit slides up from below, 250ms |
| Live signal dot | Pulse opacity 0.4 → 1.0, 2s loop |

### 7.3 What NOT to Animate
- Route transitions on the dashboard (instant — traders are checking prices, not enjoying scenery)
- Chart redraws (already animated by TradingView)
- List re-sorts
- Anything triggered by data refresh on a fast interval

---

## 8. Dashboard Layout Reference

The default authenticated view, top-to-bottom:

```
┌─────────────────────────────────────────────────────────────────┐
│ [▲BTG]  Dashboard  Strategy  Trades  Settings    ⚙  🔔  [User]│  ← Top bar, 56px
├─────────┬───────────────────────────────────────────────────────┤
│         │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│ NAV     │  │ EQUITY   │ │ DAY P&L  │ │ OPEN POS │ │ WIN RATE │ │  ← KPI strip
│         │  │$12,847.30│ │ +$237.15 │ │    2     │ │   62.4%  │ │
│ ▲ Dash  │  │  +2.34%  │ │  +1.88%  │ │  active  │ │  30 day  │ │
│ ◇ Strat │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ │
│ ⟨⟩ Trade│  ┌─────────────────────────────────────────────────┐ │
│ ⚙ Set   │  │              EQUITY CURVE (30 day)              │ │  ← Chart card
│         │  │                                                 │ │
│ ─────   │  │   /\    /\           /\___                      │ │
│         │  │  /  \  /  \__/\    /         \__/\              │ │
│ Live ●  │  │_/    \/        \__/                             │ │
│ Paper   │  └─────────────────────────────────────────────────┘ │
│         │  ┌──────────────────────┐ ┌──────────────────────┐  │
│ Bybit ● │  │ ACTIVE POSITIONS     │ │ RECENT SIGNALS       │  │  ← Two-column
│ conn'd  │  │ [ table ]            │ │ [ table ]            │  │
│         │  └──────────────────────┘ └──────────────────────┘  │
└─────────┴───────────────────────────────────────────────────────┘
```

KPI tiles use **mono font for the number**, sans for the label and delta. Delta colored success/danger based on sign.

The equity curve is the visual anchor. Line color: `var(--accent)` if positive period, `var(--text-secondary)` if neutral, `var(--danger)` only if down >5%. Filled area: 8% opacity of line color.

---

## 9. Asset Inventory

Files to be produced and stored in `public/brand/`:

- `logo-full.svg` — Full lockup (triangle + wordmark + crypto symbols)
- `logo-mark.svg` — Triangle-only mark, for favicons and small placements
- `logo-wordmark.svg` — Wordmark-only, for footers
- `logo-mark-white.svg` — Mark inverted for rare light backgrounds (email)
- `favicon.ico`, `apple-touch-icon.png`, `og-image.png`
- `email-header.png` — Branded header for transactional emails

All SVGs use `currentColor` for ink so they inherit dark-mode styling.

---

## 10. Implementation Notes

### 10.1 Tailwind Config Snippet

Use these tokens to extend `tailwind.config.ts`:

```ts
theme: {
  extend: {
    colors: {
      bg: { base: '#000', surface: '#0A0A0B', elevated: '#15151A', overlay: '#1F1F26', input: '#0D0D10' },
      border: { subtle: '#1F1F24', DEFAULT: '#27272A', strong: '#3F3F46' },
      text: { primary: '#F5F5F7', secondary: '#A1A1AA', tertiary: '#71717A', muted: '#52525B' },
      accent: { DEFAULT: '#DC2626', hover: '#EF4444' },
      success: '#22C55E',
      danger: '#DC2626',
      warning: '#F59E0B',
    },
    fontFamily: {
      display: ['"Playfair Display"', 'Georgia', 'serif'],
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['"JetBrains Mono"', 'monospace'],
    },
    borderRadius: { DEFAULT: '6px', card: '8px' },
  }
}
```

### 10.2 shadcn/ui Integration
Override the default shadcn theme by replacing the CSS variables in `app/globals.css` with the tokens from Section 2. Use `cn()` helper as documented; do not modify the shadcn primitives themselves.

### 10.3 Accessibility
- All text combinations meet WCAG AA contrast minimums on the documented backgrounds. Verify with Stark or a11y checker before each release.
- Focus rings always visible (3px `--accent-glow`).
- All interactive elements keyboard-navigable.
- Charts include text alternatives in screenreader mode (table view of same data).

---

## 11. What Not to Do

Anti-patterns that violate the BTG aesthetic:

- ❌ Gradient backgrounds, glassmorphism, blur effects
- ❌ Rounded "pill" cards with `border-radius: 24px`
- ❌ Emoji in UI
- ❌ Multiple colors used for navigation items
- ❌ Drop shadows on cards (use border instead)
- ❌ Spinning loaders (use the triangle pulse instead)
- ❌ Gamification elements (badges for "first trade", streak counters, level systems)
- ❌ Marketing language inside the product
- ❌ Light mode
- ❌ Sans-serif for the main page title (use Playfair)
- ❌ Serif for body text or buttons (use Inter)
- ❌ Floats for numeric values without `tabular-nums`

---

*End of Design System v1.0 — Black Triangle Group*
