import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { fetchHistory, fetchQuotes, fetchSearch } from "./api";
import { INDICES } from "./defaults";
import { useStore } from "./store";
import type { Quote, Range } from "./types";

/** One batched quote query for everything on screen. */
export function useQuotes() {
  const lists = useStore((s) => s.lists);
  const selected = useStore((s) => s.selected);
  const symbols = useMemo(() => {
    const set = new Set<string>(INDICES.map((i) => i.symbol));
    lists.forEach((l) => l.symbols.forEach((s) => set.add(s)));
    if (selected) set.add(selected);
    return [...set].sort();
  }, [lists, selected]);

  const q = useQuery({
    queryKey: ["quotes", symbols],
    queryFn: () => fetchQuotes(symbols),
    refetchInterval: 20_000,
    placeholderData: keepPreviousData,
    retry: 2,
  });
  const map = useMemo(() => new Map<string, Quote>((q.data ?? []).map((x) => [x.symbol, x])), [q.data]);
  return { ...q, map };
}

export function useHistory(symbol: string | null, range: Range) {
  return useQuery({
    queryKey: ["history", symbol, range],
    queryFn: () => fetchHistory(symbol!, range),
    enabled: !!symbol,
    staleTime: range === "1D" ? 30_000 : 5 * 60_000,
    refetchInterval: range === "1D" ? 60_000 : false,
    placeholderData: keepPreviousData,
  });
}

export function useSearch(q: string) {
  return useQuery({
    queryKey: ["search", q],
    queryFn: () => fetchSearch(q),
    enabled: q.length > 0,
    staleTime: 10 * 60_000,
    placeholderData: keepPreviousData,
  });
}

export function useDebounced<T>(value: T, ms = 200): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export function useNow(ms = 30_000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}

export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);
  useEffect(() => { ref.current = value; });
  return ref.current;
}
