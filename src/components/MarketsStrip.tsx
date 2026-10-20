import { INDICES } from "../lib/defaults";
import { flagFor } from "../lib/flags";
import { fmtPrice, marketLabel } from "../lib/format";
import { useStore } from "../lib/store";
import type { Quote } from "../lib/types";
import ChangePill from "./ChangePill";

const dot = { open: "bg-up pulse-dot", extended: "bg-warn", closed: "bg-muted/50" } as const;

export default function MarketsStrip({ quotes }: { quotes: Map<string, Quote> }) {
  const selected = useStore((s) => s.selected);
  const select = useStore((s) => s.select);
  return (
    <div className="no-scrollbar flex snap-x gap-2 overflow-x-auto px-4 pb-3 pt-2 lg:px-6" aria-label="World indices">
      {INDICES.map((i) => {
        const q = quotes.get(i.symbol);
        const m = marketLabel(q?.marketState);
        const active = selected === i.symbol;
        const up = (q?.changePct ?? 0) > 0;
        const down = (q?.changePct ?? 0) < 0;
        return (
          <button
            key={i.symbol}
            onClick={() => select(i.symbol)}
            title={`${i.label} · ${m.label}`}
            aria-pressed={active}
            className={`group min-w-[158px] shrink-0 snap-start rounded-[22px] border px-3.5 py-2.5 text-left transition duration-200 hover:-translate-y-0.5 ${
              active
                ? "border-accent/60 bg-accentsoft shadow-lg shadow-accent/10"
                : down
                  ? "border-line bg-downsoft/35 hover:border-down/30 hover:bg-downsoft/55"
                  : up
                    ? "border-line bg-upsoft/35 hover:border-up/30 hover:bg-upsoft/55"
                    : "border-line bg-panel/60 hover:border-accent/30 hover:bg-panel"
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted">
              <span aria-hidden className="text-sm leading-none">{flagFor(i.symbol)}</span>
              <span className="truncate">{i.label}</span>
              <span className={`ml-auto h-1.5 w-1.5 shrink-0 rounded-full ${dot[m.tone]}`} title={m.label} />
            </div>
            <div className="mt-1.5 flex items-center justify-between gap-2">
              {q ? (
                <>
                  <span className="num text-[15px] font-bold tracking-tight">{fmtPrice(q.price)}</span>
                  <ChangePill value={q.changePct} />
                </>
              ) : (
                <div className="skeleton mt-1 h-5 w-full" />
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
