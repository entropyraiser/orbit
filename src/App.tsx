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
    <svg viewBox="0 0 40 40" className="h-8 w-8 shrink-0" aria-hidden>
      <rect width="40" height="40" rx="10" fill="var(--text)" />
      <ellipse cx="20" cy="20" rx="13" ry="6.2" fill="none" stroke="var(--bg)" strokeWidth="1.7" transform="rotate(-28 20 20)" />
      <circle cx="20" cy="20" r="2.7" fill="var(--bg)" />
      <circle cx="30.4" cy="13.6" r="2.15" fill="var(--bg)" />
    </svg>
  );
}

function SearchButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} aria-label="Search assets"
      className="flex h-9 w-full items-center gap-2 rounded-full border border-line bg-panel pl-4 pr-3 text-sm text-muted transition-colors hover:bg-hover hover:text-fg">
      <Search size={16} strokeWidth={1.5} /> <span className="flex-1 truncate text-left">Search</span>
      <kbd className="hidden rounded border border-line bg-panel2 px-1.5 font-mono text-[11px] text-faint sm:block">⌘K</kbd>
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
    el.dataset.tint = tint || "signal";
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
      <header className="relative mx-auto flex w-full max-w-[1800px] items-center justify-between gap-3 px-4 pb-3 pt-4 lg:px-6">
        <div className="relative z-10 flex min-w-0 items-center gap-2">
          <BrandMark />
          <span className="text-base font-semibold">Orbit</span>
        </div>

        <div className="absolute left-1/2 hidden w-[min(28rem,calc(100%-22rem))] -translate-x-1/2 md:block">
          <SearchButton onClick={() => setSearching(true)} />
        </div>

        <div className="relative z-10 flex shrink-0 items-center gap-2">
          <span className="hidden items-center gap-2 px-2 text-xs text-muted lg:flex" title="Quotes refresh every 20s; Yahoo data may be delayed">
            <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${quotes.isError ? "bg-down" : quotes.isFetching ? "bg-faint" : "bg-up"}`} />
            {quotes.isError ? <span className="text-down">Offline, retrying</span> : updated ? <>Updated <span className="num font-mono">{updated}</span></> : "Loading"}
          </span>
          <button aria-label="Toggle theme" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="grid h-9 w-9 place-items-center rounded-full border border-line bg-panel text-muted transition-colors hover:bg-hover hover:text-fg">
            {theme === "dark" ? <Sun size={16} strokeWidth={1.5} /> : <Moon size={16} strokeWidth={1.5} />}
          </button>
          <button aria-label="Appearance settings" aria-expanded={settings} onClick={() => setSettings(true)}
            className="grid h-9 w-9 place-items-center rounded-full border border-line bg-panel text-muted transition-colors hover:bg-hover hover:text-fg">
            <Settings size={16} strokeWidth={1.5} />
          </button>
        </div>
      </header>
      <div className="px-4 pb-3 md:hidden">
        <SearchButton onClick={() => setSearching(true)} />
      </div>

      <div className="mx-auto w-full max-w-[1800px]">
        <MarketsStrip quotes={quotes.map} />
      </div>

      {/* Mobile: one natural scrolling column (no trapped short list).
          Desktop: fixed two-pane app shell with a chart that actually fills. */}
      <main className="mx-auto min-h-0 w-full max-w-[1800px] flex-1 overflow-y-auto px-4 pb-4 lg:overflow-hidden lg:px-6 lg:pb-6">
        <div className="grid items-start gap-3 lg:h-full lg:grid-cols-[360px_minmax(0,1fr)] lg:items-stretch xl:grid-cols-[400px_minmax(0,1fr)]">
          <aside className="card rise rise-1 overflow-hidden rounded-[20px] lg:min-h-0">
            <Watchlist quotes={quotes.map} onAdd={() => setSearching(true)} />
          </aside>
          <section className="card rise rise-2 flex min-h-[520px] flex-col overflow-hidden rounded-[20px] lg:min-h-0">
            {selected ? (
              <AssetDetail key={selected} symbol={selected} quote={quotes.map.get(selected)} />
            ) : (
              <div className="grid h-full place-items-center p-8 text-center">
                <div>
                  <div className="text-base font-medium">No asset selected</div>
                  <div className="mt-1 text-sm text-muted">Choose one from your watchlist, or press <kbd className="rounded border border-line bg-panel2 px-1.5 font-mono text-[11px]">/</kbd> to search.</div>
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
