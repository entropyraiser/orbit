import type { WatchList } from "./types";

export const INDICES: { symbol: string; label: string }[] = [
  { symbol: "^GSPC", label: "S&P 500" },
  { symbol: "^IXIC", label: "Nasdaq" },
  { symbol: "^FTSE", label: "FTSE 100" },
  { symbol: "^GDAXI", label: "DAX" },
  { symbol: "^N225", label: "Nikkei 225" },
  { symbol: "^HSI", label: "Hang Seng" },
  { symbol: "^NSEI", label: "Nifty 50" },
  { symbol: "000001.SS", label: "Shanghai" },
];

export const DEFAULT_LISTS: WatchList[] = [
  {
    id: "global",
    name: "Global",
    symbols: ["AAPL", "NVDA", "MSFT", "TSM", "ASML", "7203.T", "005930.KS", "0700.HK", "RELIANCE.NS", "SAP.DE"],
  },
  {
    id: "macro",
    name: "Macro",
    symbols: ["GC=F", "CL=F", "BTC-USD", "ETH-USD", "EURUSD=X", "USDINR=X", "USDJPY=X"],
  },
];
