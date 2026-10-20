import type { History, Quote, Range, SearchHit } from "./types";

async function get<T>(url: string): Promise<T> {
  const r = await fetch(url);
  if (!r.ok) {
    const body = await r.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed (${r.status})`);
  }
  return r.json();
}

export const fetchQuotes = (symbols: string[]) =>
  symbols.length ? get<Quote[]>(`/api/quotes?symbols=${encodeURIComponent(symbols.join(","))}`) : Promise.resolve([]);
export const fetchHistory = (symbol: string, range: Range) =>
  get<History>(`/api/history?symbol=${encodeURIComponent(symbol)}&range=${range}`);
export const fetchSearch = (q: string) => get<SearchHit[]>(`/api/search?q=${encodeURIComponent(q)}`);
