import { useEffect, useRef, useState } from "react";
import { Check, Search, SearchX } from "lucide-react";
import { useDebounced, useSearch } from "../lib/hooks";
import { flagFor } from "../lib/flags";
import { useStore } from "../lib/store";

export default function SearchPalette({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const dq = useDebounced(q.trim(), 200);
  const { data, isFetching, isError } = useSearch(dq);
  const inList = useStore((s) => s.lists.find((l) => l.id === s.activeListId)?.symbols ?? []);
  const listName = useStore((s) => s.lists.find((l) => l.id === s.activeListId)?.name);
  const addSymbol = useStore((s) => s.addSymbol);
  const select = useStore((s) => s.select);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => ref.current?.focus(), []);
  useEffect(() => setIdx(0), [data]);

  const results = dq ? data ?? [] : [];
  const choose = (i: number) => {
    const r = results[i];
    if (!r) return;
    if (inList.includes(r.symbol)) select(r.symbol); else addSymbol(r.symbol);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 px-4 pt-[10vh]" onMouseDown={onClose}>
      <div className="pop w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-panel" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Search assets">
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search size={16} strokeWidth={1.5} className="shrink-0 text-muted" aria-hidden />
          <input
            ref={ref} value={q} onChange={(e) => setQ(e.target.value)}
            placeholder={`Search, adds to ${listName}`}
            className="h-14 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
              else if (e.key === "ArrowDown") { e.preventDefault(); setIdx((i) => Math.min(i + 1, results.length - 1)); }
              else if (e.key === "ArrowUp") { e.preventDefault(); setIdx((i) => Math.max(i - 1, 0)); }
              else if (e.key === "Enter") choose(idx);
            }}
          />
          <kbd className="shrink-0 rounded border border-line bg-panel2 px-1.5 font-mono text-[11px] text-faint">Esc</kbd>
        </div>
        <div className="max-h-[54vh] overflow-y-auto p-2">
          {!dq && (
            <div className="px-3 py-9 text-center">
              <div className="text-sm font-medium">Search any market</div>
              <div className="mt-1 text-xs leading-relaxed text-muted">Try a name like Toyota or Nifty, a pair like EURUSD,<br />or a ticker like 7203.T.</div>
            </div>
          )}
          {dq && isFetching && !results.length && (
            <div className="space-y-1.5 p-1" aria-label="Searching">
              {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-12 w-full" />)}
            </div>
          )}
          {dq && !results.length && !isFetching && (
            <div className="px-3 py-9 text-center">
              <SearchX size={20} strokeWidth={1.5} className="mx-auto text-muted" aria-hidden />
              <div className="mt-2 text-sm font-medium">{isError ? "Search failed" : "No results"}</div>
              <div className="mt-1 text-xs text-muted">{isError ? "Check your connection and try again." : "Check the spelling, or try the exchange ticker, for example 7203.T."}</div>
            </div>
          )}
          {results.map((r, i) => {
            const added = inList.includes(r.symbol);
            return (
              <button key={r.symbol} onMouseEnter={() => setIdx(i)} onClick={() => choose(i)}
                className={`flex h-14 w-full items-center gap-3 rounded-xl px-3 text-left transition-colors ${i === idx ? "bg-panel2" : ""}`}>
                <span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-hover text-[16px]">{flagFor(r.symbol, { type: r.type, exchange: r.exchange })}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{r.name || r.symbol}</span>
                  <span className="block truncate font-mono text-xs text-muted">{r.symbol}</span>
                </span>
                <span className="hidden shrink-0 font-mono text-xs text-faint sm:block">{r.exchange}</span>
                {added
                  ? <span className="flex shrink-0 items-center gap-1 text-xs text-muted"><Check size={16} strokeWidth={1.5} /> Watching</span>
                  : i === idx && <span className="shrink-0 text-xs text-muted">Add <kbd className="rounded border border-line bg-panel2 px-1.5 font-mono text-[11px] text-faint">↵</kbd></span>}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-4 border-t border-line px-4 py-2 text-xs text-muted">
          <span><kbd className="rounded border border-line bg-panel2 px-1.5 font-mono text-[11px] text-faint">↑↓</kbd> navigate</span>
          <span><kbd className="rounded border border-line bg-panel2 px-1.5 font-mono text-[11px] text-faint">↵</kbd> add / open</span>
          <span className="ml-auto hidden sm:block">Yahoo Finance · may be delayed</span>
        </div>
      </div>
    </div>
  );
}
