import { useId, useMemo } from "react";

export default function Sparkline({
  points, baseline, dir, width = 76, height = 30,
}: { points?: [number, number][]; baseline?: number; dir: "up" | "down" | "flat"; width?: number; height?: number }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const d = useMemo(() => {
    if (!points || points.length < 2) return null;
    const vals = points.map((p) => p[1]);
    let min = Math.min(...vals), max = Math.max(...vals);
    if (baseline != null) { min = Math.min(min, baseline); max = Math.max(max, baseline); }
    const span = max - min || 1;
    const x = (i: number) => (i / (vals.length - 1)) * width;
    const y = (v: number) => height - 2 - ((v - min) / span) * (height - 4);
    const line = vals.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("");
    return { line, area: `${line}L${width},${height}L0,${height}Z`, base: baseline != null ? y(baseline) : null, end: { x: x(vals.length - 1), y: y(vals[vals.length - 1]) } };
  }, [points, baseline, width, height]);

  if (!d) return <div className="skeleton shrink-0" style={{ width, height: 12 }} />;
  const color = dir === "down" ? "var(--down)" : dir === "up" ? "var(--up)" : "var(--muted)";
  return (
    <svg width={width} height={height} className="shrink-0 overflow-visible" aria-hidden>
      <defs>
        <linearGradient id={`sg-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity=".28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {d.base != null && <line x1="0" x2={width} y1={d.base} y2={d.base} stroke="var(--line)" strokeDasharray="2 3" />}
      <path d={d.area} fill={`url(#sg-${uid})`} stroke="none" />
      <path d={d.line} fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={d.end.x} cy={d.end.y} r="2.2" fill={color} stroke="var(--panel)" strokeWidth="1.2" />
    </svg>
  );
}
