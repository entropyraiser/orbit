import { dirOf, fmtPct } from "../lib/format";

/** Quiet change figure. The sign carries direction, colour only reinforces it. */
export default function ChangePill({ value, size = "sm" }: { value?: number; size?: "sm" | "lg" }) {
  const dir = dirOf(value);
  const solid = size === "lg";
  const cls = dir === "up" ? (solid ? "bg-up text-onsem" : "bg-upsoft text-up") : dir === "down" ? (solid ? "bg-down text-onsem" : "bg-downsoft text-down") : "bg-hover text-muted";
  return (
    <span className={`num inline-flex shrink-0 items-center rounded-full font-mono font-medium ${cls} ${size === "lg" ? "px-4 py-1 text-base" : "px-2 text-xs"}`}>
      {fmtPct(value)}
    </span>
  );
}
