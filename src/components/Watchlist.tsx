import { useEffect, useRef, useState } from "react";
import { GripVertical, Plus, X } from "lucide-react";
import { useHistory, usePrevious } from "../lib/hooks";
import { flagFor } from "../lib/flags";
import { commonName, fmtPrice } from "../lib/format";
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
      className={`group relative flex h-14 cursor-pointer items-center gap-3 rounded-xl px-3 transition-colors ${
        active ? "bg-panel2 shadow-[inset_0_0_0_1px_var(--line)]" : "hover:bg-hover/60"
      } ${dragging ? "opacity-50" : ""} ${over ? "shadow-[inset_0_0_0_1px_var(--accent)]" : ""}`}
    >
      <span aria-hidden className="absolute left-0 hidden cursor-grab text-faint group-hover:block" title="Drag to reorder"><GripVertical size={12} strokeWidth={1.5} /></span>
      <span aria-hidden className={`grid h-10 w-10 shrink-0 place-items-center rounded-full bg-hover text-[18px] transition-shadow ${active ? "shadow-[0_0_0_2px_var(--accent)]" : ""}`}>
        {flagFor(symbol, { type: quote?.type, exchange: quote?.exchange, currency: quote?.currency })}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{commonName(symbol, quote)}</div>
        <div className="truncate font-mono text-xs text-muted">{symbol}</div>
      </div>
      <div className="hidden shrink-0 min-[420px]:block">
        <Sparkline points={hist.data?.points} baseline={hist.data?.previousClose ?? quote?.prevClose} dir={dir} />
      </div>
      <div key={quote?.price} className={`min-w-[4.5rem] shrink-0 rounded-md px-1 text-right ${flash}`}>
        <div className="num font-mono text-sm">{quote ? fmtPrice(quote.price) : <span className="skeleton ml-auto block h-4 w-16" />}</div>
        <div className="flex justify-end">{quote ? <ChangePill value={quote.changePct} /> : <span className="skeleton block h-4 w-12" />}</div>
      </div>
      <button
        aria-label={`Remove ${symbol}`}
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        className="absolute right-1 top-1 hidden rounded-md bg-panel p-1 text-muted ring-1 ring-line hover:text-down group-hover:block focus:block"
      >
        <X size={12} strokeWidth={1.5} />
      </button>
    </div>
  );
}

function ListTabs() {
  const lists = useStore((s) => s.lists);
  const activeId = useStore((s) => s.activeListId);
  const { setActiveList, addList, renameList, deleteList, reorderLists } = useStore.getState();
  const [editing, setEditing] = useState<{ id: string | "new"; value: string } | null>(null);
  const [drag, setDrag] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const dragged = useRef(false);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { input.current?.focus(); input.current?.select(); }, [editing?.id]);

  const commit = () => {
    if (!editing) return;
    if (editing.id === "new") { if (editing.value.trim()) addList(editing.value); }
    else renameList(editing.id, editing.value);
    setEditing(null);
  };

  return (
    <div className="no-scrollbar flex items-center gap-1 overflow-x-auto px-3 pb-2 pt-3">
      {lists.map((l, i) =>
        editing?.id === l.id ? (
          <input key={l.id} ref={input} value={editing.value} onChange={(e) => setEditing({ id: l.id, value: e.target.value })}
            onBlur={commit} onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(null); }}
            className="h-8 w-28 shrink-0 rounded-full border border-accent/60 bg-transparent px-3 text-xs font-medium outline-none" />
        ) : (
          <button key={l.id}
            draggable
            onDragStart={() => { dragged.current = true; setDrag(i); }}
            onDragOver={(e) => { e.preventDefault(); setOver(i); }}
            onDragEnd={() => { setDrag(null); setOver(null); window.setTimeout(() => { dragged.current = false; }, 0); }}
            onDrop={() => { if (drag != null) reorderLists(drag, i); setDrag(null); setOver(null); }}
            onClick={() => { if (dragged.current) return; setActiveList(l.id); }}
            onDoubleClick={() => setEditing({ id: l.id, value: l.name })}
            title="Drag to reorder · double-click to rename"
            className={`group/tab flex h-8 shrink-0 cursor-grab items-center gap-2 rounded-full px-3 text-xs font-medium transition-colors active:cursor-grabbing ${
              l.id === activeId ? "bg-panel2 text-fg shadow-[inset_0_0_0_1px_var(--line)]" : "text-muted hover:bg-hover hover:text-fg"
            } ${drag === i ? "opacity-50" : ""} ${over === i && drag !== i ? "ring-1 ring-accent" : ""}`}>
            {l.name}
            <span className="num font-mono text-[11px] text-faint">{l.symbols.length}</span>
            {l.id === activeId && lists.length > 1 && (
              <span role="button" aria-label="Delete list" tabIndex={0}
                onClick={(e) => { e.stopPropagation(); if (confirm(`Delete list "${l.name}"?`)) deleteList(l.id); }}
                className="-mr-1 hidden rounded p-0.5 hover:bg-hover group-hover/tab:inline-flex"><X size={12} strokeWidth={1.5} /></span>
            )}
          </button>
        ),
      )}
      {editing?.id === "new" ? (
        <input ref={input} value={editing.value} placeholder="List name" onChange={(e) => setEditing({ id: "new", value: e.target.value })}
          onBlur={commit} onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(null); }}
          className="h-8 w-28 shrink-0 rounded-full border border-accent/60 bg-transparent px-3 text-xs outline-none" />
      ) : (
        <button aria-label="New list" onClick={() => setEditing({ id: "new", value: "" })}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-hover hover:text-fg"><Plus size={16} strokeWidth={1.5} /></button>
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
          <div className="col-span-full mx-2 mt-4 rounded-2xl border border-line bg-panel2/40 p-6 text-center">
            <div className="text-sm font-medium">This list is empty</div>
            <div className="mt-1 text-xs leading-relaxed text-muted">Search for a stock, index, currency or crypto and add it here.</div>
            <button onClick={onAdd} className="btn-accent mt-4 h-8 rounded-full px-4 text-xs font-medium transition-opacity hover:opacity-90">Add asset</button>
          </div>
        )}
      </div>
      {list.symbols.length > 0 && (
        <div className="px-3 pb-3 pt-1">
          <button onClick={onAdd} className="flex h-8 w-full items-center justify-center gap-2 rounded-full border border-line text-xs font-medium text-muted transition-colors hover:bg-hover hover:text-fg">
            <Plus size={16} strokeWidth={1.5} /> Add asset <kbd className="rounded border border-line bg-panel2 px-1.5 font-mono text-[11px] text-faint">/</kbd>
          </button>
        </div>
      )}
    </div>
  );
}
