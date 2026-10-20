import { useEffect, useRef, useState } from "react";
import { Check, Search } from "lucide-react";
import { useDebounced, useSearch } from "../lib/hooks";
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
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 px-4 pt-[12vh] backdrop-blur-sm" onMouseDown={onClose}>
      <div className="pop w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-panel shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search size={16} className="text-muted" />
          <input
            ref={ref} value={q} onChange={(e) => setQ(e.target.value)}
            placeholder={`Search stocks, indices, FX, crypto… (adds to ${listName})`}
            className="h-14 flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
              else if (e.key === "ArrowDown") { e.preventDefault(); setIdx((i) => Math.min(i + 1, results.length - 1)); }
              else if (e.key === "ArrowUp") { e.preventDefault(); setIdx((i) => Math.max(i - 1, 0)); }
              else if (e.key === "Enter") choose(idx);
            }}
          />
          <kbd className="rounded border border-line px-1.5 py-0.5 text-[10px] text-muted">ESC</kbd>
        </div>
        <div className="max-h-[50vh] overflow-y-auto p-2">
          {!dq && <div className="px-3 py-8 text-center text-sm text-muted">Try “Toyota”, “Nifty”, “EURUSD”, “bitcoin” or a ticker like “7203.T”.</div>}
          {dq && !results.length && !isFetching && (
            <div className="px-3 py-8 text-center text-sm text-muted">{isError ? "Search failed. Try again." : "No results."}</div>
          )}
          {results.map((r, i) => (
            <button key={r.symbol} onMouseEnter={() => setIdx(i)} onClick={() => choose(i)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left ${i === idx ? "bg-hover" : ""}`}>
              <span className="w-24 shrink-0 truncate text-sm font-semibold">{r.symbol}</span>
              <span className="min-w-0 flex-1 truncate text-sm text-muted">{r.name}</span>
              <span className="shrink-0 text-xs text-muted">{r.exchange}</span>
              {inList.includes(r.symbol) && <Check size={14} className="shrink-0 text-up" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
