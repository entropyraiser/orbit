import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_LISTS } from "./defaults";
import type { Range, WatchList } from "./types";

export type Theme = "dark" | "light";
export type Tint = "none" | "mint" | "coral" | "gold" | "violet";
export type FontFace = "rounded" | "sans" | "serif" | "mono";
export type UiSize = "sm" | "md" | "lg";

export const TINTS: { id: Tint; label: string; hint: string }[] = [
  { id: "none", label: "Plain", hint: "Cool gray, no tint" },
  { id: "mint", label: "Mint", hint: "Green room" },
  { id: "coral", label: "Coral", hint: "Blush room" },
  { id: "gold", label: "Gold", hint: "Warm cream" },
  { id: "violet", label: "Violet", hint: "Lavender room" },
];
export const FONTS: { id: FontFace; label: string }[] = [
  { id: "rounded", label: "Rounded" },
  { id: "sans", label: "Grotesk" },
  { id: "serif", label: "Editorial" },
  { id: "mono", label: "Mono" },
];
export const SIZES: { id: UiSize; label: string }[] = [
  { id: "sm", label: "S" },
  { id: "md", label: "M" },
  { id: "lg", label: "L" },
];

interface State {
  lists: WatchList[];
  activeListId: string;
  selected: string | null;
  range: Range;
  theme: Theme;
  tint: Tint;
  font: FontFace;
  size: UiSize;
  setTheme: (t: Theme) => void;
  setTint: (t: Tint) => void;
  setFont: (f: FontFace) => void;
  setSize: (s: UiSize) => void;
  setRange: (r: Range) => void;
  select: (s: string | null) => void;
  setActiveList: (id: string) => void;
  addSymbol: (symbol: string, listId?: string) => void;
  removeSymbol: (listId: string, symbol: string) => void;
  reorder: (listId: string, from: number, to: number) => void;
  reorderLists: (from: number, to: number) => void;
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
      tint: "none",
      font: "rounded",
      size: "md",
      setTheme: (theme) => set({ theme }),
      setTint: (tint) => set({ tint }),
      setFont: (font) => set({ font }),
      setSize: (size) => set({ size }),
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
      reorderLists: (from, to) =>
        set((s) => {
          if (from === to) return s;
          const lists = [...s.lists];
          const [moved] = lists.splice(from, 1);
          lists.splice(to, 0, moved);
          return { lists };
        }),
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
    {
      name: "watcher:v1",
      version: 1,
      merge: (persisted, current) => ({ ...current, ...(persisted as object) }),
    },
  ),
);
