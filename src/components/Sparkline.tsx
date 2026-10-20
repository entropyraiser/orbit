import { useMemo } from "react";

export default function Sparkline({
  points, baseline, dir, width = 72, height = 28,
}: { points?: [number, number][]; baseline?: number; dir: "up" | "down" | "flat"; width?: number; height?: number }) {
  const d = useMemo(() => {
    if (!points || points.length < 2) return null;
    const vals = points.map((p) => p[1]);
    let min = Math.min(...vals), max = Math.max(...vals);
    if (baseline != null) { min = Math.min(min, baseline); max = Math.max(max, baseline); }
    const span = max - min || 1;
    const x = (i: number) => (i / (vals.length - 1)) * width;
    const y = (v: number) => height - 2 - ((v - min) / span) * (height - 4);
    return {
      path: vals.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(""),
      base: baseline != null ? y(baseline) : null,
    };
  }, [points, baseline, width, height]);

  if (!d) return <div className="skeleton" style={{ width, height: 10 }} />;
  const color = dir === "down" ? "var(--down)" : dir === "up" ? "var(--up)" : "var(--muted)";
  return (
    <svg width={width} height={height} className="shrink-0 overflow-visible" aria-hidden>
      {d.base != null && <line x1="0" x2={width} y1={d.base} y2={d.base} stroke="var(--line)" strokeDasharray="2 3" />}
      <path d={d.path} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
