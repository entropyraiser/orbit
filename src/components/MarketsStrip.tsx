import { INDICES } from "../lib/defaults";
import { dirClass, fmtPct, fmtPrice, marketLabel } from "../lib/format";
import { useStore } from "../lib/store";
import type { Quote } from "../lib/types";

const dot = { open: "bg-up", extended: "bg-amber-400", closed: "bg-muted/50" } as const;

export default function MarketsStrip({ quotes }: { quotes: Map<string, Quote> }) {
  const selected = useStore((s) => s.selected);
  const select = useStore((s) => s.select);
  return (
    <div className="flex gap-2 overflow-x-auto px-4 pb-3 pt-1 lg:px-6">
      {INDICES.map((i) => {
        const q = quotes.get(i.symbol);
        const m = marketLabel(q?.marketState);
        const active = selected === i.symbol;
        return (
          <button
            key={i.symbol}
            onClick={() => select(i.symbol)}
            title={`${i.label} · ${m.label}`}
            className={`group min-w-[148px] shrink-0 rounded-xl border px-3 py-2 text-left transition ${
              active ? "border-accent/60 bg-panel" : "border-line bg-panel/60 hover:bg-panel hover:border-line"
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs text-muted">
              <span className={`h-1.5 w-1.5 rounded-full ${dot[m.tone]}`} />
              <span className="truncate">{i.label}</span>
            </div>
            <div className="mt-0.5 flex items-baseline justify-between gap-2">
              {q ? (
                <>
                  <span className="num text-sm font-semibold">{fmtPrice(q.price)}</span>
                  <span className={`num text-xs font-medium ${dirClass(q.changePct)}`}>{fmtPct(q.changePct)}</span>
                </>
              ) : (
                <div className="skeleton mt-1 h-4 w-full" />
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
