import { useEffect, useState } from "react";
import { Moon, Search, Settings, Sun } from "lucide-react";
import AssetDetail from "./components/AssetDetail";
import MarketsStrip from "./components/MarketsStrip";
import SearchPalette from "./components/SearchPalette";
import SettingsPanel from "./components/SettingsPanel";
import Watchlist from "./components/Watchlist";
import { useQuotes } from "./lib/hooks";
import { useStore } from "./lib/store";

function BrandMark() {
  return (
    <svg viewBox="0 0 40 40" className="h-9 w-9 shrink-0" aria-hidden>
      <rect width="40" height="40" rx="12" fill="var(--text)" />
      <ellipse cx="20" cy="20" rx="13" ry="6.2" fill="none" stroke="var(--bg)" strokeWidth="1.7" transform="rotate(-28 20 20)" />
      <circle cx="20" cy="20" r="2.7" fill="var(--bg)" />
      <circle cx="30.4" cy="13.6" r="2.15" fill="var(--bg)" />
    </svg>
  );
}

function SearchButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} aria-label="Search assets"
      className="flex h-11 w-full items-center gap-2.5 rounded-full border border-line bg-panel/90 px-4 text-sm text-muted shadow-sm backdrop-blur transition hover:-translate-y-px hover:border-accent/50 hover:text-fg hover:shadow-md">
      <Search size={15} /> <span className="flex-1 truncate text-left">Search Tokyo, Texas, or Tether…</span>
      <kbd className="hidden rounded-full border border-line bg-panel2 px-2 py-0.5 text-[10px] font-semibold sm:block">⌘K</kbd>
    </button>
  );
}

export default function App() {
  const theme = useStore((s) => s.theme);
  const tint = useStore((s) => s.tint);
  const font = useStore((s) => s.font);
  const size = useStore((s) => s.size);
  const setTheme = useStore((s) => s.setTheme);
  const selected = useStore((s) => s.selected);
  const [searching, setSearching] = useState(false);
  const [settings, setSettings] = useState(false);
  const quotes = useQuotes();

  useEffect(() => {
    const el = document.documentElement;
    el.dataset.theme = theme;
    el.dataset.tint = tint || "none";
    el.dataset.font = font || "rounded";
    el.dataset.size = size || "md";
  }, [theme, tint, font, size]);

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
      <header className="relative mx-auto flex w-full max-w-[1800px] items-center justify-between gap-3 px-4 pb-1 pt-4 lg:px-6">
        <div className="relative z-10 flex min-w-0 items-center gap-2.5">
          <BrandMark />
          <div className="leading-none">
            <span className="block text-[17px] font-extrabold tracking-tight">Orbit</span>
            <span className="mt-0.5 hidden text-[10px] font-medium text-muted sm:block">every market, one screen</span>
          </div>
        </div>

        <div className="absolute left-1/2 hidden w-[min(28rem,calc(100%-22rem))] -translate-x-1/2 md:block">
          <SearchButton onClick={() => setSearching(true)} />
        </div>

        <div className="relative z-10 flex shrink-0 items-center gap-2">
          <span className="hidden items-center gap-1.5 rounded-full border border-line bg-panel/70 py-1.5 pl-2.5 pr-3 text-[11px] font-medium text-muted lg:flex" title="Quotes refresh every 20s; Yahoo data may be delayed">
            <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${quotes.isError ? "bg-down" : quotes.isFetching ? "bg-accent2 pulse-dot" : "bg-up pulse-dot"}`} />
            {quotes.isError ? <span className="text-down">Offline — retrying</span> : updated ? `Live-ish · ${updated}` : "Warming up…"}
          </span>
          <button aria-label="Toggle theme" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="grid h-10 w-10 place-items-center rounded-full border border-line bg-panel/80 text-muted transition hover:rotate-12 hover:text-fg">
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button aria-label="Appearance settings" aria-expanded={settings} onClick={() => setSettings(true)}
            className="grid h-10 w-10 place-items-center rounded-full border border-line bg-panel/80 text-muted transition hover:text-fg">
            <Settings size={16} />
          </button>
        </div>
      </header>
      <div className="px-4 pt-2 md:hidden">
        <SearchButton onClick={() => setSearching(true)} />
      </div>

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
      {settings && <SettingsPanel onClose={() => setSettings(false)} />}
    </div>
  );
}
