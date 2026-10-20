import { useEffect, useState } from "react";
import { Moon, RefreshCw, Search, Sun, TrendingUp } from "lucide-react";
import AssetDetail from "./components/AssetDetail";
import MarketsStrip from "./components/MarketsStrip";
import SearchPalette from "./components/SearchPalette";
import Watchlist from "./components/Watchlist";
import { useQuotes } from "./lib/hooks";
import { useStore } from "./lib/store";

export default function App() {
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  const selected = useStore((s) => s.selected);
  const [searching, setSearching] = useState(false);
  const quotes = useQuotes();

  useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === "INPUT" || t.tagName === "TEXTAREA") return;
      if (e.key === "/" || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k")) {
        e.preventDefault(); setSearching(true);
      } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        const { lists, activeListId, selected, select } = useStore.getState();
        const syms = lists.find((l) => l.id === activeListId)?.symbols ?? [];
        if (!syms.length) return;
        e.preventDefault();
        const i = selected ? syms.indexOf(selected) : -1;
        const n = e.key === "ArrowDown" ? Math.min(i + 1, syms.length - 1) : Math.max(i - 1, 0);
        select(syms[n < 0 ? 0 : n]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const updated = quotes.dataUpdatedAt ? new Date(quotes.dataUpdatedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : null;

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-4 px-4 py-3 lg:px-6">
        <div className="flex items-center gap-2.5">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-up/15 text-up"><TrendingUp size={17} strokeWidth={2.5} /></div>
          <span className="text-[15px] font-semibold tracking-tight">Watcher</span>
        </div>
        <button onClick={() => setSearching(true)}
          className="mx-auto flex h-10 w-full max-w-md items-center gap-2.5 rounded-xl border border-line bg-panel px-3.5 text-sm text-muted transition hover:border-muted/40">
          <Search size={15} /> <span className="flex-1 text-left">Search &amp; add assets</span>
          <kbd className="rounded border border-line px-1.5 py-0.5 text-[10px]">/</kbd>
        </button>
        <div className="flex items-center gap-1">
          <span className="hidden items-center gap-1.5 pr-2 text-xs text-muted sm:flex" title="Quotes refresh every 20s; Yahoo data may be delayed">
            <RefreshCw size={12} className={quotes.isFetching ? "animate-spin" : ""} />
            {quotes.isError ? <span className="text-down">Offline</span> : updated ? `Updated ${updated}` : "Loading…"}
          </span>
          <button aria-label="Toggle theme" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="grid h-9 w-9 place-items-center rounded-xl text-muted transition hover:bg-hover hover:text-fg">
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </header>

      <MarketsStrip quotes={quotes.map} />

      <main className="grid min-h-0 flex-1 gap-3 px-3 pb-3 lg:grid-cols-[360px_1fr] lg:px-5 lg:pb-5">
        <aside className="max-h-[42vh] min-h-0 overflow-hidden rounded-2xl border border-line bg-panel lg:max-h-none">
          <Watchlist quotes={quotes.map} onAdd={() => setSearching(true)} />
        </aside>
        <section className="min-h-0 overflow-y-auto rounded-2xl border border-line bg-panel">
          {selected ? (
            <AssetDetail key={selected} symbol={selected} quote={quotes.map.get(selected)} />
          ) : (
            <div className="grid h-full place-items-center p-10 text-center">
              <div>
                <div className="text-lg font-semibold">Select an asset</div>
                <div className="mt-1 text-sm text-muted">Pick something from your watchlist or press <kbd className="rounded border border-line px-1.5">/</kbd> to search.</div>
              </div>
            </div>
          )}
        </section>
      </main>
      {searching && <SearchPalette onClose={() => setSearching(false)} />}
    </div>
  );
}
