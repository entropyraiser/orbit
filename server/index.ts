import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import YahooFinance from "yahoo-finance2";

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] } as any);
const PORT = Number(process.env.PORT ?? 5757);
const app = express();

// ---- tiny TTL cache + in-flight de-dupe ----
const cache = new Map<string, { exp: number; val: unknown }>();
const inflight = new Map<string, Promise<unknown>>();
async function cached<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && hit.exp > Date.now()) return hit.val as T;
  const running = inflight.get(key);
  if (running) return running as Promise<T>;
  const p = fn()
    .then((val) => {
      cache.set(key, { exp: Date.now() + ttlMs, val });
      return val;
    })
    .finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}

const QUOTE_TTL = 15_000;

app.get("/api/quotes", async (req, res) => {
  const symbols = String(req.query.symbols ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 100);
  if (!symbols.length) return res.json([]);
  try {
    const key = "q:" + [...symbols].sort().join(",");
    const data = await cached(key, QUOTE_TTL, async () => {
      const r = (await yf.quote(symbols, {}, { validateResult: false } as any)) as any[];
      return r.map((q) => ({
        symbol: q.symbol,
        name: q.shortName ?? q.longName ?? q.symbol,
        longName: q.longName,
        price: q.regularMarketPrice,
        change: q.regularMarketChange,
        changePct: q.regularMarketChangePercent,
        prevClose: q.regularMarketPreviousClose,
        open: q.regularMarketOpen,
        dayHigh: q.regularMarketDayHigh,
        dayLow: q.regularMarketDayLow,
        volume: q.regularMarketVolume,
        yearHigh: q.fiftyTwoWeekHigh,
        yearLow: q.fiftyTwoWeekLow,
        marketCap: q.marketCap,
        pe: q.trailingPE,
        dividendYield: q.trailingAnnualDividendYield,
        currency: q.currency,
        exchange: q.fullExchangeName,
        marketState: q.marketState,
        type: q.quoteType,
        tz: q.exchangeTimezoneName,
        time: q.regularMarketTime ? new Date(q.regularMarketTime).getTime() : undefined,
      }));
    });
    res.json(data);
  } catch (e: any) {
    res.status(502).json({ error: e?.message ?? "quote failed" });
  }
});

type Range = "1D" | "1W" | "1M" | "1Y" | "YTD" | "5Y" | "MAX";
const DAY = 86_400_000;

function rangeSpec(range: Range): { period1: Date; interval: string; ttl: number } {
  const now = Date.now();
  switch (range) {
    case "1D": return { period1: new Date(now - 5 * DAY), interval: "5m", ttl: 30_000 };
    case "1W": return { period1: new Date(now - 8 * DAY), interval: "15m", ttl: 60_000 };
    case "1M": return { period1: new Date(now - 31 * DAY), interval: "60m", ttl: 5 * 60_000 };
    case "1Y": return { period1: new Date(now - 366 * DAY), interval: "1d", ttl: 15 * 60_000 };
    case "YTD": return { period1: new Date(new Date().getFullYear() - 1, 11, 28), interval: "1d", ttl: 15 * 60_000 };
    case "5Y": return { period1: new Date(now - 5 * 366 * DAY), interval: "1wk", ttl: 60 * 60_000 };
    case "MAX": return { period1: new Date(0), interval: "1mo", ttl: 60 * 60_000 };
  }
}

function dayKey(ms: number, tz?: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz || "UTC" }).format(ms);
}

app.get("/api/history", async (req, res) => {
  const symbol = String(req.query.symbol ?? "").trim();
  const range = String(req.query.range ?? "1M").toUpperCase() as Range;
  if (!symbol) return res.status(400).json({ error: "symbol required" });
  const spec = rangeSpec(range);
  if (!spec) return res.status(400).json({ error: "bad range" });
  try {
    const data = await cached(`h:${symbol}:${range}`, spec.ttl, async () => {
      const r = (await yf.chart(
        symbol,
        { period1: spec.period1, interval: spec.interval as any, includePrePost: false },
        { validateResult: false } as any,
      )) as any;
      const tz: string | undefined = r.meta?.exchangeTimezoneName;
      let pts: [number, number][] = (r.quotes ?? [])
        .filter((q: any) => q.close != null)
        .map((q: any) => [Math.floor(new Date(q.date).getTime() / 1000), q.close]);

      if (range === "1D" && pts.length) {
        const lastKey = dayKey(pts[pts.length - 1][0] * 1000, tz);
        pts = pts.filter((p) => dayKey(p[0] * 1000, tz) === lastKey);
      } else if (range === "1W" && pts.length) {
        const keys = [...new Set(pts.map((p) => dayKey(p[0] * 1000, tz)))].slice(-5);
        pts = pts.filter((p) => keys.includes(dayKey(p[0] * 1000, tz)));
      } else if (range === "YTD") {
        const y = new Date().getFullYear();
        const first = pts.find((p) => dayKey(p[0] * 1000, tz).startsWith(String(y)));
        // keep last close of prior year as baseline so YTD change is accurate
        const idx = first ? pts.indexOf(first) : 0;
        pts = pts.slice(Math.max(0, idx - 1));
      } else if (range === "1M" && pts.length) {
        const cutoff = Date.now() / 1000 - 30 * 86400;
        pts = pts.filter((p) => p[0] >= cutoff);
      }
      return {
        symbol,
        range,
        points: pts,
        previousClose: r.meta?.chartPreviousClose as number | undefined,
        currency: r.meta?.currency as string | undefined,
        tz,
      };
    });
    res.json(data);
  } catch (e: any) {
    res.status(502).json({ error: e?.message ?? "history failed" });
  }
});

app.get("/api/search", async (req, res) => {
  const q = String(req.query.q ?? "").trim();
  if (!q) return res.json([]);
  try {
    const data = await cached(`s:${q.toLowerCase()}`, 10 * 60_000, async () => {
      const r = (await yf.search(q, { quotesCount: 10, newsCount: 0 }, { validateResult: false } as any)) as any;
      return (r.quotes ?? [])
        .filter((x: any) => x.symbol && x.isYahooFinance !== false)
        .map((x: any) => ({
          symbol: x.symbol,
          name: x.shortname ?? x.longname ?? x.symbol,
          exchange: x.exchDisp ?? x.exchange,
          type: x.quoteType ?? x.typeDisp,
        }));
    });
    res.json(data);
  } catch (e: any) {
    res.status(502).json({ error: e?.message ?? "search failed" });
  }
});

if (process.env.NODE_ENV === "production") {
  const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../dist");
  app.use(express.static(dist));
  app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(dist, "index.html")));
}

app.listen(PORT, "127.0.0.1", () => {
  console.log(`Orbit API on http://127.0.0.1:${PORT}`);
});
