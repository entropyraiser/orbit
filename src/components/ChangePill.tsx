import { dirOf, fmtPct } from "../lib/format";

/** Pill change badge — arrow + sign so direction never relies on colour alone. */
export default function ChangePill({ value, size = "sm" }: { value?: number; size?: "sm" | "lg" }) {
  const dir = dirOf(value);
  const cls = dir === "up" ? "bg-upsoft text-up" : dir === "down" ? "bg-downsoft text-down" : "bg-hover text-muted";
  const arrow = dir === "up" ? "▲" : dir === "down" ? "▼" : "•";
  return (
    <span className={`num inline-flex shrink-0 items-center gap-1 rounded-full font-bold ${cls} ${
      size === "lg" ? "px-3 py-1 text-sm" : "px-2 py-0.5 text-[11px]"
    }`}>
      <span aria-hidden className={size === "lg" ? "text-[10px]" : "text-[8px]"}>{arrow}</span>
      {fmtPct(value)}
    </span>
  );
}
