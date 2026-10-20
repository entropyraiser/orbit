import type { WatchList } from "./types";

export const INDICES: { symbol: string; label: string }[] = [
  { symbol: "^IXIC", label: "Nasdaq" },
  { symbol: "^DJI", label: "Dow" },
  { symbol: "^GSPC", label: "S&P 500" },
  { symbol: "^KS11", label: "KOSPI" },
  { symbol: "^N225", label: "Nikkei" },
  { symbol: "^GDAXI", label: "DAX" },
  { symbol: "^FTSE", label: "FTSE" },
  { symbol: "^HSI", label: "Hang Seng" },
  { symbol: "^NSEI", label: "Nifty 50" },
  { symbol: "000001.SS", label: "Shanghai" },
];

/** Shipped starter lists — snapshot of the author's watchlists, used on a fresh install. */
export const DEFAULT_LISTS: WatchList[] = [
  {
    id: "global",
    name: "Global indices",
    symbols: ["^IXIC", "^DJI", "^GSPC", "^KS11", "^N225", "^GDAXI", "^FTSE", "^HSI", "^NSEI", "000001.SS"],
  },
  {
    id: "commodities",
    name: "Commodities",
    symbols: ["GC=F", "SI=F", "BZ=F", "CL=F", "NG=F"],
  },
  {
    id: "currency",
    name: "Currency",
    symbols: ["USDINR=X", "^TNX", "USDJPY=X"],
  },
  {
    id: "india",
    name: "India",
    symbols: ["^NSEI", "^NSEBANK", "^CNXIT", "^BSESN", "NIFTY_MIDCAP_100.NS", "^CNXSC"],
  },
  {
    id: "us",
    name: "US",
    symbols: ["NVDA", "META", "AVGO", "AMZN", "GOOG", "P", "NTNX", "ANET", "NTAP", "MU", "TSM"],
  },
];

/** Friendly names shown above the ticker while quotes load (and as a fallback). */
export const COMMON_NAMES: Record<string, string> = {
  ...Object.fromEntries(INDICES.map((i) => [i.symbol, i.label])),
  "GC=F": "Gold",
  "SI=F": "Silver",
  "BZ=F": "Brent",
  "CL=F": "WTI",
  "NG=F": "Nat gas",
  "USDINR=X": "USD/INR",
  "^TNX": "US 10Y",
  "USDJPY=X": "Yen carry",
  "^NSEBANK": "Nifty Bank",
  "^CNXIT": "Nifty IT",
  "^BSESN": "Sensex",
  "NIFTY_MIDCAP_100.NS": "Midcap",
  "^CNXSC": "Smallcap",
  NVDA: "NVIDIA",
  META: "Meta",
  AVGO: "Broadcom",
  AMZN: "Amazon",
  GOOG: "Alphabet",
  P: "Everpure",
  NTNX: "Nutanix",
  ANET: "Arista",
  NTAP: "NetApp",
  MU: "Micron",
  TSM: "TSMC",
};
