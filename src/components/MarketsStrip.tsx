import { INDICES } from "../lib/defaults";
import { flagFor } from "../lib/flags";
import { fmtPrice, marketLabel } from "../lib/format";
import { useStore } from "../lib/store";
import type { Quote } from "../lib/types";
import ChangePill from "./ChangePill";

const dot = { open: "bg-up", extended: "bg-warn", closed: "bg-faint" } as const;

export default function MarketsStrip({ quotes }: { quotes: Map<string, Quote> }) {
  const selected = useStore((s) => s.selected);
  const select = useStore((s) => s.select);
  return (
    <div className="no-scrollbar flex snap-x gap-2 overflow-x-auto px-4 pb-3 lg:px-6" aria-label="World indices">
      {INDICES.map((i) => {
        const q = quotes.get(i.symbol);
        const m = marketLabel(q?.marketState);
        const active = selected === i.symbol;
        const dirn = q?.changePct == null || q.changePct === 0 ? "flat" : q.changePct > 0 ? "up" : "down";
        return (
          <button
            key={i.symbol}
            onClick={() => select(i.symbol)}
            title={`${i.label} · ${m.label}`}
            aria-pressed={active}
            className={`group min-w-[160px] shrink-0 snap-start rounded-2xl border px-3 py-2 text-left transition-colors ${
              active ? "border-fg/25 bg-accentsoft"
                : dirn === "down" ? "border-line bg-downsoft/50 hover:bg-downsoft"
                : dirn === "up" ? "border-line bg-upsoft/50 hover:bg-upsoft"
                : "border-line bg-panel hover:bg-hover"
            }`}
          >
            <div className="flex items-center gap-2 text-xs text-muted">
              <span aria-hidden className="text-sm leading-none">{flagFor(i.symbol)}</span>
              <span className="truncate">{i.label}</span>
              <span className={`ml-auto h-1.5 w-1.5 shrink-0 rounded-full ${dot[m.tone]}`} title={m.label} />
            </div>
            <div className="mt-1 flex items-center justify-between gap-2">
              {q ? (
                <>
                  <span className="num font-mono text-sm font-medium">{fmtPrice(q.price)}</span>
                  <ChangePill value={q.changePct} />
                </>
              ) : (
                <div className="skeleton h-5 w-full" />
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
