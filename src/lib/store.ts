import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_LISTS } from "./defaults";
import type { Range, WatchList } from "./types";

export type Theme = "dark" | "light";

interface State {
  lists: WatchList[];
  activeListId: string;
  selected: string | null;
  range: Range;
  theme: Theme;
  setTheme: (t: Theme) => void;
  setRange: (r: Range) => void;
  select: (s: string | null) => void;
  setActiveList: (id: string) => void;
  addSymbol: (symbol: string, listId?: string) => void;
  removeSymbol: (listId: string, symbol: string) => void;
  reorder: (listId: string, from: number, to: number) => void;
  addList: (name: string) => void;
  renameList: (id: string, name: string) => void;
  deleteList: (id: string) => void;
}

const initialTheme = (): Theme =>
  typeof matchMedia !== "undefined" && matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      lists: DEFAULT_LISTS,
      activeListId: DEFAULT_LISTS[0].id,
      selected: DEFAULT_LISTS[0].symbols[0],
      range: "1D",
      theme: initialTheme(),
      setTheme: (theme) => set({ theme }),
      setRange: (range) => set({ range }),
      select: (selected) => set({ selected }),
      setActiveList: (id) => {
        const l = get().lists.find((x) => x.id === id);
        set({ activeListId: id, selected: l?.symbols[0] ?? get().selected });
      },
      addSymbol: (symbol, listId) =>
        set((s) => {
          const id = listId ?? s.activeListId;
          return {
            selected: symbol,
            lists: s.lists.map((l) =>
              l.id === id && !l.symbols.includes(symbol) ? { ...l, symbols: [...l.symbols, symbol] } : l,
            ),
          };
        }),
      removeSymbol: (listId, symbol) =>
        set((s) => {
          const lists = s.lists.map((l) =>
            l.id === listId ? { ...l, symbols: l.symbols.filter((x) => x !== symbol) } : l,
          );
          let selected = s.selected;
          if (selected === symbol) {
            selected = lists.find((l) => l.id === s.activeListId)?.symbols[0] ?? null;
          }
          return { lists, selected };
        }),
      reorder: (listId, from, to) =>
        set((s) => ({
          lists: s.lists.map((l) => {
            if (l.id !== listId || from === to) return l;
            const symbols = [...l.symbols];
            const [m] = symbols.splice(from, 1);
            symbols.splice(to, 0, m);
            return { ...l, symbols };
          }),
        })),
      addList: (name) =>
        set((s) => {
          const id = "l" + Date.now().toString(36);
          return { lists: [...s.lists, { id, name: name.trim() || "New list", symbols: [] }], activeListId: id };
        }),
      renameList: (id, name) =>
        set((s) => ({ lists: s.lists.map((l) => (l.id === id ? { ...l, name: name.trim() || l.name } : l)) })),
      deleteList: (id) =>
        set((s) => {
          if (s.lists.length <= 1) return s;
          const lists = s.lists.filter((l) => l.id !== id);
          const activeListId = s.activeListId === id ? lists[0].id : s.activeListId;
          const selected = s.activeListId === id ? lists[0].symbols[0] ?? null : s.selected;
          return { lists, activeListId, selected };
        }),
    }),
    { name: "watcher:v1", version: 1 },
  ),
);
