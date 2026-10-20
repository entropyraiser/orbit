import { Plus, Check } from "lucide-react";
import { useHistory, useNow } from "../lib/hooks";
import { dirClass, dirOf, fmtCompact, fmtPct, fmtPrice, fmtSigned, localTime, marketLabel } from "../lib/format";
import { useStore } from "../lib/store";
import { RANGES, type Quote } from "../lib/types";
import PriceChart from "./PriceChart";

const tone = { open: "bg-up", extended: "bg-amber-400", closed: "bg-muted/60" } as const;

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-line/70 py-2.5">
      <span className="text-xs text-muted">{label}</span>
      <span className="num text-sm font-medium">{value}</span>
    </div>
  );
}

function RangeBar({ low, high, price }: { low?: number; high?: number; price?: number }) {
  if (low == null || high == null || price == null || high <= low) return null;
  const pct = Math.min(100, Math.max(0, ((price - low) / (high - low)) * 100));
  return (
    <div className="mt-1 h-1 w-full rounded-full bg-line">
      <div className="relative h-full">
        <span className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-fg" style={{ left: `${pct}%` }} />
      </div>
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

  // change over the selected period
  const first = pts[0]?.[1];
  let base = range === "1D" ? quote?.prevClose ?? hist.data?.previousClose ?? first : first;
  const price = quote?.price ?? pts[pts.length - 1]?.[1];
  const change = price != null && base != null ? price - base : undefined;
  const pct = change != null && base ? (change / base) * 100 : undefined;
  const dir = dirOf(change);
  const m = marketLabel(quote?.marketState);
  const periodLabel = { "1D": "Today", "1W": "Past week", "1M": "Past month", "1Y": "Past year", YTD: "Year to date", "5Y": "Past 5 years", MAX: "All time" }[range];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-wrap items-start justify-between gap-4 px-5 pt-5 lg:px-8 lg:pt-7">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-muted">
            <span className="rounded-md bg-hover px-1.5 py-0.5 font-semibold text-fg">{symbol}</span>
            <span className="truncate">{quote?.exchange}</span>
            {quote?.type && <span>· {quote.type.charAt(0) + quote.type.slice(1).toLowerCase()}</span>}
          </div>
          <h1 className="mt-1.5 truncate text-xl font-semibold tracking-tight lg:text-2xl">
            {quote?.longName ?? quote?.name ?? <span className="skeleton inline-block h-7 w-56 align-middle" />}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-muted">
            <span className={`h-2 w-2 rounded-full ${tone[m.tone]}`} />
            {m.label}{quote?.tz ? ` · ${localTime(quote.tz, now)}` : ""}
          </div>
          {!inList && (
            <button onClick={() => addSymbol(symbol)} className="flex items-center gap-1 rounded-lg bg-accent px-2.5 py-1.5 text-xs font-semibold text-white hover:opacity-90">
              <Plus size={13} /> Add to list
            </button>
          )}
          {inList && <span className="flex items-center gap-1 text-xs text-muted"><Check size={13} /> In list</span>}
        </div>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3 px-5 pt-4 lg:px-8">
        <div>
          <div className="flex items-baseline gap-2">
            {price != null ? (
              <span className="num text-4xl font-semibold tracking-tight lg:text-5xl">{fmtPrice(price)}</span>
            ) : (
              <span className="skeleton inline-block h-12 w-48" />
            )}
            <span className="text-sm text-muted">{quote?.currency}</span>
          </div>
          <div className={`num mt-1 flex items-center gap-2 text-sm font-medium ${dirClass(change)}`}>
            <span>{fmtSigned(change)}</span>
            <span>({fmtPct(pct)})</span>
            <span className="font-normal text-muted">{periodLabel}</span>
          </div>
        </div>
        <div className="flex rounded-xl bg-panel2 p-1" role="tablist">
          {RANGES.map((r) => (
            <button key={r} role="tab" aria-selected={r === range} onClick={() => setRange(r)}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${r === range ? "bg-fg text-bg shadow" : "text-muted hover:text-fg"}`}>
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="relative mt-3 min-h-[260px] flex-1 px-2 lg:px-4">
        {hist.isError && !pts.length ? (
          <div className="flex h-full items-center justify-center text-sm text-muted">Couldn’t load chart data. {(hist.error as Error).message}</div>
        ) : !pts.length ? (
          hist.isFetching ? <div className="skeleton absolute inset-x-4 inset-y-2 opacity-40" /> :
          <div className="flex h-full items-center justify-center text-sm text-muted">No chart data for this range.</div>
        ) : (
          <div className={`h-full transition-opacity ${hist.isFetching && hist.isPlaceholderData ? "opacity-50" : ""}`}>
            <PriceChart points={pts} tz={hist.data?.tz} range={range} baseline={base} dir={dir} />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-x-10 border-t border-line px-5 pb-5 pt-2 sm:grid-cols-2 lg:grid-cols-3 lg:px-8">
        <Stat label="Previous close" value={fmtPrice(quote?.prevClose)} />
        <Stat label="Open" value={fmtPrice(quote?.open)} />
        <Stat label="Volume" value={fmtCompact(quote?.volume)} />
        <div>
          <Stat label="Day range" value={`${fmtPrice(quote?.dayLow)} – ${fmtPrice(quote?.dayHigh)}`} />
          <RangeBar low={quote?.dayLow} high={quote?.dayHigh} price={quote?.price} />
        </div>
        <div>
          <Stat label="52-week range" value={`${fmtPrice(quote?.yearLow)} – ${fmtPrice(quote?.yearHigh)}`} />
          <RangeBar low={quote?.yearLow} high={quote?.yearHigh} price={quote?.price} />
        </div>
        <Stat label="Market cap" value={fmtCompact(quote?.marketCap)} />
        <Stat label="P/E ratio" value={quote?.pe != null ? quote.pe.toFixed(2) : "—"} />
        <Stat label="Dividend yield" value={quote?.dividendYield != null ? (quote.dividendYield * 100).toFixed(2) + "%" : "—"} />
        <Stat label="Currency" value={quote?.currency ?? "—"} />
      </div>
    </div>
  );
}
