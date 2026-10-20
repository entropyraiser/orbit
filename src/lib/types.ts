export type Range = "1D" | "1W" | "1M" | "1Y" | "YTD" | "5Y" | "MAX";
export const RANGES: Range[] = ["1D", "1W", "1M", "1Y", "YTD", "5Y", "MAX"];

export interface Quote {
  symbol: string;
  name: string;
  longName?: string;
  price?: number;
  change?: number;
  changePct?: number;
  prevClose?: number;
  open?: number;
  dayHigh?: number;
  dayLow?: number;
  volume?: number;
  yearHigh?: number;
  yearLow?: number;
  marketCap?: number;
  pe?: number;
  dividendYield?: number;
  currency?: string;
  exchange?: string;
  marketState?: string;
  type?: string;
  tz?: string;
  time?: number;
}

export interface History {
  symbol: string;
  range: Range;
  points: [number, number][];
  previousClose?: number;
  currency?: string;
  tz?: string;
}

export interface SearchHit {
  symbol: string;
  name: string;
  exchange?: string;
  type?: string;
}

export interface WatchList {
  id: string;
  name: string;
  symbols: string[];
}
