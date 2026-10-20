import { COMMON_NAMES } from "./defaults";

/** Common name above the ticker: "Nifty 50" before "^NSEI". */
export function commonName(symbol: string, quote?: { name?: string; longName?: string }): string {
  if (COMMON_NAMES[symbol]) return COMMON_NAMES[symbol];
  const raw = quote?.name || quote?.longName;
  if (!raw) return symbol;
  if (raw === raw.toUpperCase() && /[A-Z]{3,}/.test(raw)) {
    return raw.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return raw;
}

export function fmtPrice(n?: number): string {
  if (n == null || !isFinite(n)) return "—";
  const abs = Math.abs(n);
  const digits = abs >= 1000 ? 2 : abs >= 1 ? 2 : abs >= 0.1 ? 4 : 6;
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: digits });
}
export function fmtSigned(n?: number): string {
  if (n == null || !isFinite(n)) return "—";
  return (n > 0 ? "+" : n < 0 ? "−" : "") + fmtPrice(Math.abs(n));
}
export function fmtPct(n?: number): string {
  if (n == null || !isFinite(n)) return "—";
  return (n > 0 ? "+" : n < 0 ? "−" : "") + Math.abs(n).toFixed(2) + "%";
}
export function fmtCompact(n?: number): string {
  if (n == null || !isFinite(n)) return "—";
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 }).format(n);
}
export const dirOf = (n?: number): "up" | "down" | "flat" => (n == null || n === 0 ? "flat" : n > 0 ? "up" : "down");
export const dirClass = (n?: number) => (n == null || n === 0 ? "text-muted" : n > 0 ? "text-up" : "text-down");

export function localTime(tz?: string, now = Date.now()): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: tz, hour: "numeric", minute: "2-digit", timeZoneName: "short",
    }).format(now);
  } catch {
    return "";
  }
}

export function marketLabel(state?: string): { label: string; tone: "open" | "extended" | "closed" } {
  switch (state) {
    case "REGULAR": return { label: "Market open", tone: "open" };
    case "PRE": case "PREPRE": return { label: "Pre-market", tone: "extended" };
    case "POST": case "POSTPOST": return { label: "After hours", tone: "extended" };
    default: return { label: "Market closed", tone: "closed" };
  }
}
