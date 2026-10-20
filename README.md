# Watcher

A personal, local-only global watchlist dashboard: stocks, indices, FX, crypto and commodities from markets around the world on one screen, with Google Finance-style line charts.

Data comes from Yahoo Finance (unofficial, via `yahoo-finance2`) and may be delayed. Intended for personal use on localhost only.

## Run

```bash
./install.sh        # installs deps, builds, starts in the background on a free port (prints the URL)
./uninstall.sh      # stops it and removes node_modules, dist, .watcher
```

For development (hot reload, UI at http://127.0.0.1:5173, API at :5757):

```bash
npm install
npm run dev
```

Other scripts: `npm run typecheck`, `npm run build`, `PORT=5757 npm start` (serves the built app + API on one port).

## Architecture

```
server/index.ts      Express API (127.0.0.1 only) wrapping yahoo-finance2, with a small in-memory TTL cache
  GET /api/quotes?symbols=A,B,...     batched quotes
  GET /api/history?symbol=X&range=R   R in 1D | 1W | 1M | 1Y | YTD | 5Y | MAX  -> [[unixSeconds, close], ...]
  GET /api/search?q=text              symbol search
src/
  App.tsx                      page shell, keyboard shortcuts (/, Cmd+K, up/down)
  components/
    MarketsStrip.tsx           world indices strip with market open/closed dots
    Watchlist.tsx              list tabs, rows with sparklines, drag-to-reorder, add/remove
    AssetDetail.tsx            price header, range tabs, chart, key stats
    PriceChart.tsx             TradingView Lightweight Charts area chart + hover tooltip
    Sparkline.tsx              tiny SVG sparkline
    SearchPalette.tsx          search-and-add modal
  lib/
    store.ts                   Zustand store, persisted to localStorage key "watcher:v1"
    hooks.ts                   TanStack Query hooks (quotes poll every 20s)
    api.ts, types.ts, format.ts, defaults.ts
design-samples/      Static HTML mockups of alternative visual directions (not part of the app)
```

## Data and storage

- localStorage holds only the lists, selected asset, chart range and theme.
- Price history is not persisted: it is cached in server memory (30s to 1h depending on range) and in browser memory, and re-fetched after a restart.

## Styling

Tailwind CSS v4 with theme tokens as CSS variables in `src/index.css` (`:root[data-theme="dark" | "light"]`). Colors are consumed through Tailwind (`bg-panel`, `text-muted`, `text-up`, ...) and, for the chart, read from the same variables in `PriceChart.tsx`.
