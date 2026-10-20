import { useEffect, useState } from "react";
import { Moon, Search, Sun } from "lucide-react";
import AssetDetail from "./components/AssetDetail";
import MarketsStrip from "./components/MarketsStrip";
import SearchPalette from "./components/SearchPalette";
import Watchlist from "./components/Watchlist";
import { useQuotes } from "./lib/hooks";
import { useStore } from "./lib/store";

function EyeMark() {
  return (
    <div aria-hidden className="brand-grad relative h-10 w-10 shrink-0 rounded-full shadow-lg shadow-accent/35">
      <span className="absolute left-[21%] top-[30%] h-2.5 w-2.5 rounded-full bg-white" />
      <span className="absolute right-[21%] top-[30%] h-2.5 w-2.5 rounded-full bg-white" />
    </div>
  );
}

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
    <div className="flex h-full flex-col overflow-x-hidden">
      <header className="mx-auto flex w-full max-w-[1800px] flex-wrap items-center gap-2.5 px-4 pb-1 pt-4 sm:gap-3 lg:px-6">
        <div className="flex min-w-0 shrink-0 items-center gap-2.5">
          <EyeMark />
          <div className="leading-none">
            <span className="block text-[17px] font-extrabold lowercase tracking-tight">watcher</span>
            <span className="mt-0.5 hidden text-[10px] font-medium text-muted sm:block">the whole world, one list</span>
          </div>
        </div>
        <button onClick={() => setSearching(true)}
          className="order-last flex h-11 min-w-0 flex-1 basis-full items-center gap-2.5 rounded-full border border-line bg-panel/80 px-4 text-sm text-muted shadow-sm backdrop-blur transition hover:-translate-y-px hover:border-accent/50 hover:text-fg hover:shadow-md sm:order-none sm:basis-auto sm:max-w-md">
          <Search size={15} /> <span className="flex-1 truncate text-left">Search Tokyo, Texas, or Tether…</span>
          <kbd className="hidden rounded-full border border-line bg-panel2 px-2 py-0.5 text-[10px] font-semibold sm:block">⌘K</kbd>
        </button>
        <div className="ml-auto flex shrink-0 items-center gap-2 sm:ml-0">
          <span className="hidden items-center gap-1.5 rounded-full border border-line bg-panel/70 py-1.5 pl-2.5 pr-3 text-[11px] font-medium text-muted md:flex" title="Quotes refresh every 20s; Yahoo data may be delayed">
            <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${quotes.isError ? "bg-down" : quotes.isFetching ? "bg-accent2 pulse-dot" : "bg-up pulse-dot"}`} />
            {quotes.isError ? <span className="text-down">Offline — retrying</span> : updated ? `Live-ish · ${updated}` : "Warming up…"}
          </span>
          <button aria-label="Toggle theme" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="grid h-10 w-10 place-items-center rounded-full border border-line bg-panel/80 text-muted transition hover:rotate-12 hover:text-fg">
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1800px]">
        <MarketsStrip quotes={quotes.map} />
      </div>

      {/* Mobile: one natural scrolling column (no trapped short list).
          Desktop: fixed two-pane app shell with a chart that actually fills. */}
      <main className="mx-auto min-h-0 w-full max-w-[1800px] flex-1 overflow-y-auto px-3 pb-4 lg:overflow-hidden lg:px-5 lg:pb-5">
        <div className="grid items-start gap-3 lg:h-full lg:grid-cols-[360px_minmax(0,1fr)] lg:items-stretch xl:grid-cols-[400px_minmax(0,1fr)]">
          <aside className="card rise rise-1 overflow-hidden rounded-[28px] lg:min-h-0">
            <Watchlist quotes={quotes.map} onAdd={() => setSearching(true)} />
          </aside>
          <section className="card rise rise-2 flex min-h-[520px] flex-col overflow-hidden rounded-[28px] lg:min-h-0">
            {selected ? (
              <AssetDetail key={selected} symbol={selected} quote={quotes.map.get(selected)} />
            ) : (
              <div className="grid h-full place-items-center p-10 text-center">
                <div>
                  <div aria-hidden className="text-5xl">🌍</div>
                  <div className="mt-3 text-lg font-bold">Pick a corner of the world</div>
                  <div className="mt-1 text-sm text-muted">Choose something from your watchlist, or press <kbd className="rounded-full border border-line bg-panel2 px-2 py-0.5 text-[11px]">/</kbd> to search anywhere.</div>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
      {searching && <SearchPalette onClose={() => setSearching(false)} />}
    </div>
  );
}
