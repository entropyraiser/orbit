import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Check, CloudOff, Compass, Plus } from "lucide-react";
import { useHistory, useNow } from "../lib/hooks";
import { flagFor, regionFor } from "../lib/flags";
import { dirOf, fmtCompact, fmtPrice, fmtSigned, localTime, marketLabel } from "../lib/format";
import { useStore } from "../lib/store";
import { RANGES, type Quote, type Range } from "../lib/types";
import AnimatedPrice from "./AnimatedPrice";
import ChangePill from "./ChangePill";
import PriceChart from "./PriceChart";

const tone = { open: "bg-up", extended: "bg-warn", closed: "bg-faint" } as const;

function Stat({ label, value, children }: { label: string; value: string; children?: React.ReactNode }) {
  return (
    <div className="min-w-0 border-t border-line pt-3">
      <div className="text-xs text-muted">{label}</div>
      <div className="num mt-1 truncate font-mono text-sm" title={value}>{value}</div>
      {children}
    </div>
  );
}

function RangeBar({ low, high, price }: { low?: number; high?: number; price?: number }) {
  if (low == null || high == null || price == null || high <= low) return null;
  const pct = Math.min(100, Math.max(0, ((price - low) / (high - low)) * 100));
  return (
    <div className="relative mt-3 h-1 w-full rounded-full bg-line">
      <span className="absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-fg" style={{ left: `${pct}%` }} />
    </div>
  );
}

/** Range tabs with a sliding selection. */
function RangeTabs({ range, setRange }: { range: Range; setRange: (r: Range) => void }) {
  const wrap = useRef<HTMLDivElement>(null);
  const btns = useRef(new Map<string, HTMLButtonElement>());
  const [pill, setPill] = useState<{ x: number; w: number } | null>(null);

  const measure = () => {
    const el = btns.current.get(range), w = wrap.current;
    if (el && w) setPill({ x: el.offsetLeft, w: el.offsetWidth });
  };
  useLayoutEffect(measure, [range]);
  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [range]);

  return (
    <div ref={wrap} className="no-scrollbar relative flex overflow-x-auto rounded-full bg-panel2 p-1" role="tablist" aria-label="Chart range">
      {pill && (
        <span aria-hidden className="absolute inset-y-1 rounded-full bg-hover shadow-[inset_0_0_0_1px_var(--line)] transition-[left,width] duration-200 ease-[cubic-bezier(.2,0,0,1)]"
          style={{ left: pill.x, width: pill.w }} />
      )}
      {RANGES.map((r) => (
        <button key={r} ref={(el) => { if (el) btns.current.set(r, el); }} role="tab" aria-selected={r === range} onClick={() => setRange(r)}
          className={`relative z-10 h-7 shrink-0 rounded-full px-3 text-xs font-medium transition-colors ${r === range ? "text-fg" : "text-muted hover:text-fg"}`}>
          {r}
        </button>
      ))}
    </div>
  );
}

export default function AssetDetail({ quote, symbol }: { quote?: Quote; symbol: string }) {
  const range = useStore((s) => s.range);
  const setRange = useStore((s) => s.setRange);
  const inList = useStore((s) => s.lists.find((l) => l.id === s.activeListId)?.symbols.includes(symbol));
  const addSymbol = useStore((s) => s.addSymbol);
  const hist = useHistory(symbol, range);
  const now = useNow();
  const pts = hist.data?.symbol === symbol ? hist.data.points : [];

  const first = pts[0]?.[1];
  let base = range === "1D" ? quote?.prevClose ?? hist.data?.previousClose ?? first : first;
  const price = quote?.price ?? pts[pts.length - 1]?.[1];
  const change = price != null && base != null ? price - base : undefined;
  const pct = change != null && base ? (change / base) * 100 : undefined;
  const dir = dirOf(change);
  const m = marketLabel(quote?.marketState);
  const periodLabel = { "1D": "vs previous close", "1W": "vs 1 week ago", "1M": "vs 1 month ago", "1Y": "vs 1 year ago", YTD: "year to date", "5Y": "vs 5 years ago", MAX: "since first listing" }[range];
  const region = regionFor(symbol);

  return (
    <div className={`hero-in flex min-h-[520px] flex-col lg:h-full lg:min-h-0`}>
      <div className="relative z-10 flex flex-wrap items-start justify-between gap-4 px-5 pt-5 lg:px-6 lg:pt-6">
        <div className="flex min-w-0 items-center gap-4">
          <span aria-hidden className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-hover text-[26px]">
            {flagFor(symbol, { type: quote?.type, exchange: quote?.exchange, currency: quote?.currency })}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
              <span className="font-mono text-fg">{symbol}</span>
              {region && <span>· {region}</span>}
              <span className="truncate">{quote?.exchange}</span>
              {quote?.type && <span>· {quote.type.charAt(0) + quote.type.slice(1).toLowerCase()}</span>}
            </div>
            <h1 className="mt-1 truncate text-xl font-medium lg:text-2xl">
              {quote?.longName ?? quote?.name ?? <span className="skeleton inline-block h-7 w-56 align-middle" />}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-muted">
            <span className={`h-1.5 w-1.5 rounded-full ${tone[m.tone]}`} />
            {m.label}{quote?.tz ? <> · <span className="num font-mono">{localTime(quote.tz, now)}</span></> : ""}
          </div>
          {!inList && (
<button onClick={() => addSymbol(symbol)} className="btn-accent flex h-8 items-center gap-2 rounded-full px-4 text-xs font-medium transition-opacity hover:opacity-90">
              <Plus size={16} strokeWidth={1.5} /> Add to list
            </button>
          )}
          {inList && <span className="flex items-center gap-2 text-xs text-muted"><Check size={16} strokeWidth={1.5} /> Watching</span>}
        </div>
      </div>

      <div className="relative z-10 flex flex-wrap items-end justify-between gap-x-4 gap-y-4 px-5 pt-6 lg:px-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-end gap-x-2.5 gap-y-1">
            <AnimatedPrice value={price} className="num text-[clamp(4rem,9vw,6.5rem)] font-semibold leading-none tracking-[-0.04em]" />
            <span className="mb-2 font-mono text-base text-muted">{quote?.currency}</span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <ChangePill value={pct} size="lg" />
            <span className={`num font-mono text-sm ${dir === "up" ? "text-up" : dir === "down" ? "text-down" : "text-muted"}`}>{fmtSigned(change)}</span>
            <span className="text-sm text-muted">{periodLabel}</span>
          </div>
        </div>
        <RangeTabs range={range} setRange={setRange} />
      </div>

      {/* Absolute-fill chart so flex height actually reaches Lightweight Charts. */}
      <div className="relative z-10 mt-4 min-h-[260px] flex-1 px-2 lg:min-h-0 lg:px-4">
        <div className="absolute inset-x-2 inset-y-0 lg:inset-x-4">
          {hist.isError && !pts.length ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
              <CloudOff size={20} strokeWidth={1.5} className="text-muted" aria-hidden />
              <div className="text-sm font-medium">Chart failed to load</div>
              <div className="max-w-sm text-xs leading-relaxed text-muted">This range could not be loaded. {(hist.error as Error).message}</div>
              <button onClick={() => hist.refetch()} className="btn-accent mt-2 h-8 rounded-full px-4 text-xs font-medium transition-opacity hover:opacity-90">Retry</button>
            </div>
          ) : !pts.length ? (
            hist.isFetching ? (
              <div className="skeleton h-full w-full" />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                <Compass size={20} strokeWidth={1.5} className="text-muted" aria-hidden />
                <div className="text-sm font-medium">No data for this range</div>
                <div className="text-xs text-muted">Try a different range. Some assets have a shorter history.</div>
              </div>
            )
          ) : (
            <div className={`h-full transition-opacity duration-300 ${hist.isFetching && hist.isPlaceholderData ? "opacity-40" : ""}`}>
              <PriceChart points={pts} tz={hist.data?.tz} range={range} baseline={base} dir={dir} />
            </div>
          )}
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-2 gap-x-6 gap-y-4 px-5 pb-6 pt-4 sm:grid-cols-4 lg:px-6">
        <Stat label="Previous close" value={fmtPrice(quote?.prevClose)} />
        <Stat label="Open" value={fmtPrice(quote?.open)} />
        <Stat label="Volume" value={fmtCompact(quote?.volume)} />
        <Stat label="Market cap" value={fmtCompact(quote?.marketCap)} />
        <Stat label="Day range" value={`${fmtPrice(quote?.dayLow)} – ${fmtPrice(quote?.dayHigh)}`}>
          <RangeBar low={quote?.dayLow} high={quote?.dayHigh} price={quote?.price} />
        </Stat>
        <Stat label="52-week range" value={`${fmtPrice(quote?.yearLow)} – ${fmtPrice(quote?.yearHigh)}`}>
          <RangeBar low={quote?.yearLow} high={quote?.yearHigh} price={quote?.price} />
        </Stat>
        <Stat label="P/E ratio" value={quote?.pe != null ? quote.pe.toFixed(2) : "—"} />
        <Stat label="Dividend yield" value={quote?.dividendYield != null ? (quote.dividendYield * 100).toFixed(2) + "%" : "—"} />
      </div>
    </div>
  );
}
