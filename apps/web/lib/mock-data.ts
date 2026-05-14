export type SymbolMeta = {
  symbol: string;
  short: string;
  basePrice: number;
  decimals: number;
  volatility: number;
};

export const SYMBOLS: SymbolMeta[] = [
  { symbol: "BTCUSDT.P", short: "BTC", basePrice: 79_388.5, decimals: 1, volatility: 0.0007 },
  { symbol: "ETHUSDT.P", short: "ETH", basePrice: 3_168.4, decimals: 2, volatility: 0.0011 },
  { symbol: "SOLUSDT.P", short: "SOL", basePrice: 162.85, decimals: 2, volatility: 0.0016 },
  { symbol: "XRPUSDT.P", short: "XRP", basePrice: 0.6184, decimals: 4, volatility: 0.0014 },
  { symbol: "DOGEUSDT.P", short: "DOGE", basePrice: 0.1428, decimals: 4, volatility: 0.002 },
];

export type Position = {
  id: string;
  symbol: string;
  side: "long" | "short";
  entryPrice: number;
  markPrice: number;
  sizeUSD: number;
  pnlUSD: number;
  pnlPct: number;
  stopLoss: number;
  partialsHit: number;
  partialsTotal: number;
  openedAt: string;
};

export type SignalRow = {
  id: string;
  symbol: string;
  side: "long" | "short";
  lvnLow: number;
  lvnHigh: number;
  status: "filled" | "invalidated" | "pending" | "sl-hit";
  resultR: number | null;
  ts: string;
};

export type TradeRow = {
  id: string;
  symbol: string;
  side: "long" | "short";
  entryPrice: number;
  exitPrice: number;
  sizeUSD: number;
  pnlUSD: number;
  resultR: number;
  durationMin: number;
  outcome: "win" | "loss" | "break-even";
  openedAt: string;
  closedAt: string;
};

// Empty real-data placeholders. Populated by the engine once it's connected.
export const positions: Position[] = [];
export const signals: SignalRow[] = [];
export const trades: TradeRow[] = [];
