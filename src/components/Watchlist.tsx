import { useEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { useHistory, usePrevious } from "../lib/hooks";
import { dirClass, dirOf, fmtPct, fmtPrice } from "../lib/format";
import { useStore } from "../lib/store";
import type { Quote } from "../lib/types";
import Sparkline from "./Sparkline";

function Row({
  symbol, quote, active, onSelect, onRemove, dragProps, dragging, over,
}: {
  symbol: string; quote?: Quote; active: boolean; onSelect: () => void; onRemove: () => void;
  dragProps: React.HTMLAttributes<HTMLDivElement>; dragging: boolean; over: boolean;
}) {
  const hist = useHistory(symbol, "1D");
  const prev = usePrevious(quote?.price);
  const dir = dirOf(quote?.changePct);
  const flash = prev != null && quote?.price != null && prev !== quote.price ? (quote.price > prev ? "flash-up" : "flash-down") : "";
  return (
    <div
      {...dragProps}
      role="option"
      aria-selected={active}
      onClick={onSelect}
      className={`group relative flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition ${
        active ? "bg-hover" : "hover:bg-hover/60"
      } ${dragging ? "opacity-40" : ""} ${over ? "ring-1 ring-accent/60" : ""}`}
    >
      {active && <span className="absolute left-0 top-2.5 h-[calc(100%-20px)] w-0.5 rounded-full bg-accent" />}
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold">{symbol}</div>
        <div className="truncate text-xs text-muted">{quote?.name ?? <span className="skeleton inline-block h-3 w-24 align-middle" />}</div>
      </div>
      <Sparkline points={hist.data?.points} baseline={hist.data?.previousClose ?? quote?.prevClose} dir={dir} />
      <div key={quote?.price} className={`w-[84px] shrink-0 rounded-md text-right ${flash}`}>
        <div className="num text-sm font-semibold">{quote ? fmtPrice(quote.price) : <span className="skeleton ml-auto block h-4 w-16" />}</div>
        <div className={`num text-xs font-medium ${dirClass(quote?.changePct)}`}>{quote ? fmtPct(quote.changePct) : ""}</div>
      </div>
      <button
        aria-label={`Remove ${symbol}`}
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        className="absolute right-1 top-1 hidden rounded-md p-0.5 text-muted hover:bg-line hover:text-fg group-hover:block"
      >
        <X size={12} />
      </button>
    </div>
  );
}

function ListTabs() {
  const lists = useStore((s) => s.lists);
  const activeId = useStore((s) => s.activeListId);
  const { setActiveList, addList, renameList, deleteList } = useStore.getState();
  const [editing, setEditing] = useState<{ id: string | "new"; value: string } | null>(null);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { input.current?.focus(); input.current?.select(); }, [editing?.id]);

  const commit = () => {
    if (!editing) return;
    if (editing.id === "new") { if (editing.value.trim()) addList(editing.value); }
    else renameList(editing.id, editing.value);
    setEditing(null);
  };

  return (
    <div className="flex items-center gap-1 overflow-x-auto px-3 pb-2 pt-3">
      {lists.map((l) =>
        editing?.id === l.id ? (
          <input key={l.id} ref={input} value={editing.value} onChange={(e) => setEditing({ id: l.id, value: e.target.value })}
            onBlur={commit} onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(null); }}
            className="w-24 rounded-full border border-accent/60 bg-transparent px-3 py-1 text-xs outline-none" />
        ) : (
          <button key={l.id} onClick={() => setActiveList(l.id)}
            onDoubleClick={() => setEditing({ id: l.id, value: l.name })}
            title="Double-click to rename"
            className={`group/tab flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition ${
              l.id === activeId ? "bg-fg text-bg" : "text-muted hover:bg-hover hover:text-fg"
            }`}>
            {l.name}
            {l.id === activeId && lists.length > 1 && (
              <span role="button" aria-label="Delete list"
                onClick={(e) => { e.stopPropagation(); if (confirm(`Delete list "${l.name}"?`)) deleteList(l.id); }}
                className="-mr-1 hidden rounded-full p-0.5 hover:bg-bg/20 group-hover/tab:inline-flex"><X size={10} /></span>
            )}
          </button>
        ),
      )}
      {editing?.id === "new" ? (
        <input ref={input} value={editing.value} placeholder="List name" onChange={(e) => setEditing({ id: "new", value: e.target.value })}
          onBlur={commit} onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(null); }}
          className="w-24 rounded-full border border-accent/60 bg-transparent px-3 py-1 text-xs outline-none" />
      ) : (
        <button aria-label="New list" onClick={() => setEditing({ id: "new", value: "" })}
          className="shrink-0 rounded-full p-1.5 text-muted hover:bg-hover hover:text-fg"><Plus size={14} /></button>
      )}
    </div>
  );
}

export default function Watchlist({ quotes, onAdd }: { quotes: Map<string, Quote>; onAdd: () => void }) {
  const list = useStore((s) => s.lists.find((l) => l.id === s.activeListId)!);
  const selected = useStore((s) => s.selected);
  const { select, removeSymbol, reorder } = useStore.getState();
  const [drag, setDrag] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ListTabs />
      <div role="listbox" className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-2 pb-3">
        {list.symbols.map((sym, i) => (
          <Row
            key={sym}
            symbol={sym}
            quote={quotes.get(sym)}
            active={selected === sym}
            onSelect={() => select(sym)}
            onRemove={() => removeSymbol(list.id, sym)}
            dragging={drag === i}
            over={over === i && drag !== i}
            dragProps={{
              draggable: true,
              onDragStart: () => setDrag(i),
              onDragOver: (e) => { e.preventDefault(); setOver(i); },
              onDragEnd: () => { setDrag(null); setOver(null); },
              onDrop: () => { if (drag != null) reorder(list.id, drag, i); setDrag(null); setOver(null); },
            }}
          />
        ))}
        {list.symbols.length === 0 && (
          <div className="mx-2 mt-6 rounded-2xl border border-dashed border-line p-6 text-center">
            <div className="text-sm font-medium">This list is empty</div>
            <div className="mt-1 text-xs text-muted">Search for a stock, index, currency or crypto to start tracking it.</div>
            <button onClick={onAdd} className="mt-4 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white">Add an asset</button>
          </div>
        )}
      </div>
    </div>
  );
}
