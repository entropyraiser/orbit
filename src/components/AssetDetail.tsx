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

const tone = { open: "bg-up pulse-dot", extended: "bg-warn", closed: "bg-muted/60" } as const;

function Stat({ label, value, children }: { label: string; value: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-[22px] bg-panel2/70 px-3.5 py-3 transition hover:bg-panel2">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</div>
      <div className="num mt-1 truncate text-sm font-bold" title={value}>{value}</div>
      {children}
    </div>
  );
}

function RangeBar({ low, high, price, dir }: { low?: number; high?: number; price?: number; dir: string }) {
  if (low == null || high == null || price == null || high <= low) return null;
  const pct = Math.min(100, Math.max(0, ((price - low) / (high - low)) * 100));
  return (
    <div className="mt-2.5 h-1.5 w-full rounded-full bg-line/80">
      <div className={`relative h-full rounded-full ${dir === "down" ? "bg-down/70" : "bg-up/70"}`} style={{ width: `${Math.max(pct, 2)}%` }}>
        <span className="absolute right-0 top-1/2 h-3 w-3 -translate-y-1/2 translate-x-1/2 rounded-full border-2 border-panel bg-fg shadow" />
      </div>
    </div>
  );
}

/** Range tabs with a springy sliding pill. */
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
    <div ref={wrap} className="no-scrollbar relative flex overflow-x-auto rounded-full bg-panel2/90 p-1 shadow-inner" role="tablist" aria-label="Chart range">
      {pill && (
        <span aria-hidden className="absolute inset-y-1 rounded-full bg-fg shadow-md transition-all duration-300 [transition-timing-function:cubic-bezier(.34,1.45,.64,1)]"
          style={{ left: pill.x, width: pill.w }} />
      )}
      {RANGES.map((r) => (
        <button key={r} ref={(el) => { if (el) btns.current.set(r, el); }} role="tab" aria-selected={r === range} onClick={() => setRange(r)}
          className={`relative z-10 shrink-0 rounded-full px-2.5 py-1.5 text-xs font-bold transition-colors sm:px-3 ${r === range ? "text-bg" : "text-muted hover:text-fg"}`}>
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
  const periodLabel = { "1D": "today", "1W": "past week", "1M": "past month", "1Y": "past year", YTD: "year to date", "5Y": "past 5 years", MAX: "all time" }[range];
  const mood = dir === "up" ? "On the rise" : dir === "down" ? "Cooling off" : "Holding steady";
  const region = regionFor(symbol);
  const moodClass = dir === "up" ? "mood-up" : dir === "down" ? "mood-down" : "mood-flat";

  return (
    <div className={`hero-in flex min-h-[520px] flex-col lg:h-full lg:min-h-0 ${moodClass}`}>
      <div className="relative z-10 flex flex-wrap items-start justify-between gap-4 px-5 pt-5 lg:px-8 lg:pt-7">
        <div className="flex min-w-0 items-center gap-3.5">
          <span aria-hidden className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-panel2 text-[26px] shadow-inner ring-1 ring-line">
            {flagFor(symbol, { type: quote?.type, exchange: quote?.exchange, currency: quote?.currency })}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
              <span className="rounded-full bg-fg px-2 py-0.5 font-bold text-bg">{symbol}</span>
              {region && <span>{region}</span>}
              <span className="truncate">{quote?.exchange}</span>
              {quote?.type && <span>· {quote.type.charAt(0) + quote.type.slice(1).toLowerCase()}</span>}
            </div>
            <h1 className="mt-1.5 truncate text-xl font-extrabold tracking-tight lg:text-2xl">
              {quote?.longName ?? quote?.name ?? <span className="skeleton inline-block h-7 w-56 align-middle" />}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-line bg-panel/70 px-3 py-1.5 text-xs font-medium text-muted backdrop-blur">
            <span className={`h-2 w-2 rounded-full ${tone[m.tone]}`} />
            {m.label}{quote?.tz ? ` · ${localTime(quote.tz, now)}` : ""}
          </div>
          {!inList && (
            <button onClick={() => addSymbol(symbol)} className="brand-grad flex items-center gap-1 rounded-full px-3.5 py-2 text-xs font-bold text-white shadow-lg shadow-accent/25 transition hover:-translate-y-px">
              <Plus size={13} /> Add to list
            </button>
          )}
          {inList && <span className="flex items-center gap-1 rounded-full bg-upsoft px-3 py-1.5 text-xs font-bold text-up"><Check size={13} /> Watching</span>}
        </div>
      </div>

      <div className="relative z-10 flex flex-wrap items-end justify-between gap-x-4 gap-y-3 px-5 pt-4 lg:px-8">
        <div className="min-w-0">
          <div className="flex flex-wrap items-end gap-x-2.5 gap-y-1">
            <AnimatedPrice value={price} className="num text-[clamp(2.6rem,8vw,4.5rem)] font-extrabold leading-none tracking-[-0.045em]" />
            <span className="mb-1.5 rounded-full bg-panel2 px-2 py-0.5 text-xs font-bold text-muted">{quote?.currency}</span>
          </div>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <ChangePill value={pct} size="lg" />
            <span className={`num text-sm font-semibold ${dir === "up" ? "text-up" : dir === "down" ? "text-down" : "text-muted"}`}>{fmtSigned(change)}</span>
            <span className="text-sm text-muted">{periodLabel} · {mood.toLowerCase()}</span>
          </div>
        </div>
        <RangeTabs range={range} setRange={setRange} />
      </div>

      {/* Absolute-fill chart so flex height actually reaches Lightweight Charts. */}
      <div className="relative z-10 mt-2 min-h-[260px] flex-1 px-1.5 lg:min-h-0 lg:px-3">
        <div className="absolute inset-x-1.5 inset-y-0 lg:inset-x-3">
          {hist.isError && !pts.length ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
              <span aria-hidden className="grid h-12 w-12 place-items-center rounded-full bg-downsoft text-down"><CloudOff size={20} /></span>
              <div className="text-sm font-bold">The chart went on a coffee break</div>
              <div className="max-w-sm text-xs leading-relaxed text-muted">We couldn’t load this range. {(hist.error as Error).message}</div>
              <button onClick={() => hist.refetch()} className="brand-grad mt-2 rounded-full px-4 py-2 text-xs font-bold text-white shadow-lg shadow-accent/25">Try again</button>
            </div>
          ) : !pts.length ? (
            hist.isFetching ? (
              <div className="h-full overflow-hidden rounded-3xl">
                <div className="skeleton h-full w-full" />
                <div className="absolute inset-x-8 bottom-8 top-10 flex items-end gap-2 opacity-40" aria-hidden>
                  {[38, 55, 42, 66, 58, 78, 62, 88, 72, 95, 84, 100].map((h, i) => <div key={i} className="flex-1 rounded-t-lg bg-panel" style={{ height: `${h}%` }} />)}
                </div>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                <span aria-hidden className="grid h-12 w-12 place-items-center rounded-full bg-accentsoft text-accent"><Compass size={20} /></span>
                <div className="text-sm font-bold">No trail for this range yet</div>
                <div className="text-xs text-muted">Try a different range — some assets keep a shorter diary.</div>
              </div>
            )
          ) : (
            <div className={`h-full transition-opacity duration-300 ${hist.isFetching && hist.isPlaceholderData ? "opacity-40" : ""}`}>
              <PriceChart points={pts} tz={hist.data?.tz} range={range} baseline={base} dir={dir} />
            </div>
          )}
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-2 gap-2 px-5 pb-6 pt-3 sm:grid-cols-3 lg:px-8 xl:grid-cols-5">
        <Stat label="Previous close" value={fmtPrice(quote?.prevClose)} />
        <Stat label="Open" value={fmtPrice(quote?.open)} />
        <Stat label="Volume" value={fmtCompact(quote?.volume)} />
        <Stat label="Market cap" value={fmtCompact(quote?.marketCap)} />
        <Stat label="P/E ratio" value={quote?.pe != null ? quote.pe.toFixed(2) : "—"} />
        <Stat label="Day range" value={`${fmtPrice(quote?.dayLow)} – ${fmtPrice(quote?.dayHigh)}`}>
          <RangeBar low={quote?.dayLow} high={quote?.dayHigh} price={quote?.price} dir={dir} />
        </Stat>
        <Stat label="52-week range" value={`${fmtPrice(quote?.yearLow)} – ${fmtPrice(quote?.yearHigh)}`}>
          <RangeBar low={quote?.yearLow} high={quote?.yearHigh} price={quote?.price} dir={dir} />
        </Stat>
        <Stat label="Dividend yield" value={quote?.dividendYield != null ? (quote.dividendYield * 100).toFixed(2) + "%" : "—"} />
        <Stat label="Currency" value={quote?.currency ?? "—"} />
        <Stat label="Mood" value={mood} />
      </div>
    </div>
  );
}
