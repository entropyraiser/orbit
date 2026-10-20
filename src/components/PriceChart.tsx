import { useEffect, useRef, useState } from "react";
import {
  AreaSeries, ColorType, CrosshairMode, LineStyle, createChart,
  type IChartApi, type IPriceLine, type ISeriesApi, type UTCTimestamp,
} from "lightweight-charts";
import type { Range } from "../lib/types";
import { fmtPrice } from "../lib/format";
import { useStore } from "../lib/store";

const dtfCache = new Map<string, Intl.DateTimeFormat>();
const offCache = new Map<string, number>();
function tzOffsetSec(ts: number, tz?: string): number {
  if (!tz) return 0;
  const key = tz + ":" + Math.floor(ts / 3600);
  const hit = offCache.get(key);
  if (hit != null) return hit;
  let f = dtfCache.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
    dtfCache.set(tz, f);
  }
  const p: Record<string, string> = {};
  f.formatToParts(ts * 1000).forEach((x) => (p[x.type] = x.value));
  const off = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) / 1000 - ts;
  offCache.set(key, off);
  return off;
}

const css = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

interface Props {
  points: [number, number][];
  tz?: string;
  range: Range;
  baseline?: number;
  dir: "up" | "down" | "flat";
}

export default function PriceChart({ points, tz, range, baseline, dir }: Props) {
  const theme = useStore((s) => s.theme);
  const host = useRef<HTMLDivElement>(null);
  const chart = useRef<IChartApi | null>(null);
  const series = useRef<ISeriesApi<"Area"> | null>(null);
  const baseLine = useRef<IPriceLine | null>(null);
  const [tip, setTip] = useState<{ x: number; y: number; price: number; time: number } | null>(null);
  const intraday = range === "1D" || range === "1W" || range === "1M";

  // create once
  useEffect(() => {
    const c = createChart(host.current!, {
      autoSize: true,
      handleScroll: false,
      handleScale: false,
      layout: { background: { type: ColorType.Solid, color: "transparent" }, fontFamily: "Inter, system-ui, sans-serif", fontSize: 12 },
      grid: { vertLines: { visible: false } },
      rightPriceScale: { borderVisible: false, scaleMargins: { top: 0.08, bottom: 0.04 } },
      timeScale: { borderVisible: false, fixLeftEdge: true, fixRightEdge: true, rightOffset: 0 },
      crosshair: { mode: CrosshairMode.Magnet, vertLine: { labelVisible: false, style: LineStyle.Solid, width: 1 }, horzLine: { visible: false, labelVisible: false } },
    });
    const s = c.addSeries(AreaSeries, {
      lineWidth: 2, priceLineVisible: false, lastValueVisible: false,
      crosshairMarkerRadius: 5, crosshairMarkerBorderWidth: 2,
    });
    chart.current = c;
    series.current = s;
    c.subscribeCrosshairMove((p) => {
      const d = p.seriesData.get(s) as { value?: number } | undefined;
      if (!p.point || p.time == null || d?.value == null) return setTip(null);
      setTip({ x: p.point.x, y: p.point.y, price: d.value, time: p.time as number });
    });
    return () => { c.remove(); chart.current = null; series.current = null; };
  }, []);

  // colors follow theme + direction
  useEffect(() => {
    const color = dir === "down" ? css("--down") : dir === "up" ? css("--up") : css("--accent");
    series.current?.applyOptions({
      lineColor: color,
      topColor: `color-mix(in srgb, ${color} 28%, transparent)`,
      bottomColor: `color-mix(in srgb, ${color} 0%, transparent)`,
      crosshairMarkerBorderColor: css("--panel"),
      crosshairMarkerBackgroundColor: color,
    });
    chart.current?.applyOptions({
      layout: { textColor: css("--muted") },
      grid: { horzLines: { color: css("--line") } },
      crosshair: { vertLine: { color: css("--muted") } },
    });
  }, [dir, theme]);

  // data
  useEffect(() => {
    const s = series.current, c = chart.current;
    if (!s || !c) return;
    let last = 0;
    const data: { time: UTCTimestamp; value: number }[] = [];
    for (const [t, v] of points) {
      const st = t + tzOffsetSec(t, tz);
      if (st > last) { data.push({ time: st as UTCTimestamp, value: v }); last = st; }
    }
    const ref = data.length ? data[data.length - 1].value : 1;
    const prec = ref >= 1 ? 2 : ref >= 0.1 ? 4 : 6;
    s.applyOptions({ priceFormat: { type: "price", precision: prec, minMove: Math.pow(10, -prec) } });
    s.setData(data);
    c.applyOptions({ timeScale: { timeVisible: intraday, secondsVisible: false } });
    c.timeScale().fitContent();
    if (baseLine.current) { s.removePriceLine(baseLine.current); baseLine.current = null; }
    if (range === "1D" && baseline != null) {
      baseLine.current = s.createPriceLine({
        price: baseline, color: css("--muted"), lineWidth: 1, lineStyle: LineStyle.Dashed, axisLabelVisible: false,
      });
    }
  }, [points, tz, range, baseline, intraday]);

  const tipText = tip
    ? new Intl.DateTimeFormat("en-US", {
        timeZone: "UTC", month: "short", day: "numeric", year: intraday ? undefined : "numeric",
        ...(intraday ? { weekday: "short", hour: "numeric", minute: "2-digit" } : {}),
      }).format(tip.time * 1000)
    : "";
  const w = host.current?.clientWidth ?? 0;

  return (
    <div className="relative h-full w-full">
      <div ref={host} className="absolute inset-0" />
      {tip && (
        <div
          className="pointer-events-none absolute z-10 rounded-lg border border-line bg-panel/95 px-2.5 py-1.5 shadow-lg backdrop-blur"
          style={{ left: Math.min(Math.max(tip.x - 60, 4), Math.max(w - 130, 4)), top: 4 }}
        >
          <div className="num text-sm font-semibold">{fmtPrice(tip.price)}</div>
          <div className="text-[11px] text-muted">{tipText}</div>
        </div>
      )}
    </div>
  );
}
