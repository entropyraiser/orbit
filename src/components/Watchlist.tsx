import { useEffect, useRef, useState } from "react";
import { GripVertical, Plus, X } from "lucide-react";
import { useHistory, usePrevious } from "../lib/hooks";
import { flagFor } from "../lib/flags";
import { fmtPrice } from "../lib/format";
import { useStore } from "../lib/store";
import type { Quote } from "../lib/types";
import ChangePill from "./ChangePill";
import Sparkline from "./Sparkline";

function Row({
  symbol, quote, active, onSelect, onRemove, dragProps, dragging, over,
}: {
  symbol: string; quote?: Quote; active: boolean; onSelect: () => void; onRemove: () => void;
  dragProps: React.HTMLAttributes<HTMLDivElement>; dragging: boolean; over: boolean;
}) {
  const hist = useHistory(symbol, "1D");
  const prev = usePrevious(quote?.price);
  const dir = quote?.changePct == null || quote.changePct === 0 ? "flat" : quote.changePct > 0 ? "up" : "down";
  const flash = prev != null && quote?.price != null && prev !== quote.price ? (quote.price > prev ? "flash-up" : "flash-down") : "";
  return (
    <div
      {...dragProps}
      role="option"
      aria-selected={active}
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(); } }}
      className={`group relative flex cursor-pointer items-center gap-2.5 rounded-[22px] px-2.5 py-2.5 transition duration-200 ${
        active ? "bg-accentsoft shadow-[inset_0_0_0_1px_var(--accent-soft),0_8px_22px_-12px_var(--glow-accent)]" : "hover:translate-x-0.5 hover:bg-hover/70"
      } ${dragging ? "scale-[.97] rotate-1 opacity-50 shadow-lg" : ""} ${over ? "shadow-[inset_0_0_0_2px_var(--accent)]" : ""}`}
    >
      {active && <span aria-hidden className="brand-grad absolute left-0 top-3 h-[calc(100%-24px)] w-1 rounded-full" />}
      <span aria-hidden className="-ml-1 hidden cursor-grab text-muted/50 group-hover:block" title="Drag to reorder"><GripVertical size={13} /></span>
      <span aria-hidden className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-[17px] ${active ? "bg-panel shadow-sm" : "bg-panel2"}`}>
        {flagFor(symbol, { type: quote?.type, exchange: quote?.exchange, currency: quote?.currency })}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-bold tracking-tight">{symbol}</div>
        <div className="truncate text-xs text-muted">{quote?.name ?? <span className="skeleton inline-block h-3 w-24 align-middle" />}</div>
      </div>
      <div className="hidden shrink-0 min-[420px]:block">
        <Sparkline points={hist.data?.points} baseline={hist.data?.previousClose ?? quote?.prevClose} dir={dir} />
      </div>
      <div key={quote?.price} className={`min-w-[4.5rem] shrink-0 rounded-2xl px-1 py-0.5 text-right ${flash}`}>
        <div className="num text-sm font-bold tracking-tight">{quote ? fmtPrice(quote.price) : <span className="skeleton ml-auto block h-4 w-16" />}</div>
        <div className="mt-0.5 flex justify-end">{quote ? <ChangePill value={quote.changePct} /> : <span className="skeleton block h-4 w-12" />}</div>
      </div>
      <button
        aria-label={`Remove ${symbol}`}
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        className="absolute -right-0.5 -top-0.5 hidden rounded-full bg-panel p-1 text-muted shadow ring-1 ring-line hover:text-down group-hover:block focus:block"
      >
        <X size={11} />
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
    <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto px-3.5 pb-2 pt-3.5">
      {lists.map((l) =>
        editing?.id === l.id ? (
          <input key={l.id} ref={input} value={editing.value} onChange={(e) => setEditing({ id: l.id, value: e.target.value })}
            onBlur={commit} onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(null); }}
            className="w-28 shrink-0 rounded-full border border-accent/60 bg-transparent px-3.5 py-1.5 text-xs font-semibold outline-none" />
        ) : (
          <button key={l.id} onClick={() => setActiveList(l.id)}
            onDoubleClick={() => setEditing({ id: l.id, value: l.name })}
            title="Double-click to rename"
            className={`group/tab flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
              l.id === activeId ? "bg-fg text-bg shadow-md" : "bg-panel2/70 text-muted hover:bg-hover hover:text-fg"
            }`}>
            {l.name}
            <span className={`rounded-full px-1.5 text-[10px] ${l.id === activeId ? "bg-bg/20" : "bg-hover"}`}>{l.symbols.length}</span>
            {l.id === activeId && lists.length > 1 && (
              <span role="button" aria-label="Delete list" tabIndex={0}
                onClick={(e) => { e.stopPropagation(); if (confirm(`Delete list "${l.name}"?`)) deleteList(l.id); }}
                className="-mr-1 hidden rounded-full p-0.5 hover:bg-bg/20 group-hover/tab:inline-flex"><X size={10} /></span>
            )}
          </button>
        ),
      )}
      {editing?.id === "new" ? (
        <input ref={input} value={editing.value} placeholder="List name" onChange={(e) => setEditing({ id: "new", value: e.target.value })}
          onBlur={commit} onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(null); }}
          className="w-28 shrink-0 rounded-full border border-accent/60 bg-transparent px-3.5 py-1.5 text-xs outline-none" />
      ) : (
        <button aria-label="New list" onClick={() => setEditing({ id: "new", value: "" })}
          className="shrink-0 rounded-full bg-panel2/70 p-2 text-muted transition hover:bg-accent hover:text-white"><Plus size={13} /></button>
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
    <div className="flex flex-col lg:h-full lg:min-h-0">
      <ListTabs />
      <div role="listbox" aria-label={list.name} className="grid grid-cols-1 gap-1 px-2 pb-2 min-[600px]:grid-cols-2 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col lg:overflow-y-auto">
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
          <div className="col-span-full mx-2 mt-4 rounded-3xl border border-dashed border-line bg-panel2/40 p-7 text-center">
            <div aria-hidden className="text-4xl">🌱</div>
            <div className="mt-2 text-sm font-bold">A blank map, full of promise</div>
            <div className="mt-1 text-xs leading-relaxed text-muted">Search for a stock, index, currency or crypto — anywhere on Earth — and pin it here.</div>
            <button onClick={onAdd} className="brand-grad mt-4 rounded-full px-4 py-2 text-xs font-bold text-white shadow-lg shadow-accent/25 transition hover:-translate-y-px">Add your first asset</button>
          </div>
        )}
      </div>
      {list.symbols.length > 0 && (
        <div className="px-3.5 pb-3.5 pt-1">
          <button onClick={onAdd} className="flex w-full items-center justify-center gap-1.5 rounded-full border border-dashed border-line py-2 text-xs font-bold text-muted transition hover:border-accent/60 hover:text-accent">
            <Plus size={13} /> Add asset <kbd className="rounded-full bg-panel2 px-1.5 text-[9px]">/</kbd>
          </button>
        </div>
      )}
    </div>
  );
}
