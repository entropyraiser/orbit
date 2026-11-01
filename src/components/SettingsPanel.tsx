import { useEffect, useRef } from "react";
import { FONTS, SIZES, TINTS, useStore, type FontFace, type Tint } from "../lib/store";

/** Up and down colours per palette, shown as a split swatch. */
const TINT_SWATCH: Record<Tint, [string, string]> = {
  signal: ["#c6ff3d", "#ff5c7a"],
  ocean: ["#3dd6ff", "#ff9a3d"],
  sunset: ["#ffc247", "#ff4d6d"],
  mint: ["#3ee6a0", "#ff6b88"],
  violet: ["#b69cff", "#ff7ab8"],
  mono: ["#f4f4f5", "#ff5c7a"],
};

const FONT_FAMILY: Record<FontFace, string> = {
  rounded: 'ui-rounded, "SF Pro Rounded", system-ui, sans-serif',
  sans: 'system-ui, -apple-system, "Segoe UI", sans-serif',
  serif: 'ui-serif, Georgia, serif',
  mono: 'ui-monospace, "SF Mono", Menlo, monospace',
};

function Seg<T extends string>({
  label, value, options, onChange,
}: {
  label: string;
  value: T;
  options: { id: T; label: string; hint?: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <div className="mb-2 text-xs text-muted">{label}</div>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const on = opt.id === value;
          return (
            <button
              key={opt.id}
              role="radio"
              aria-checked={on}
              title={opt.hint}
              onClick={() => onChange(opt.id)}
              className={`h-8 rounded-full border px-3 text-xs font-medium transition-colors ${
                on ? "border-line bg-hover text-fg" : "border-transparent text-muted hover:bg-hover hover:text-fg"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function SettingsPanel({ onClose }: { onClose: () => void }) {
  const theme = useStore((s) => s.theme);
  const tint = useStore((s) => s.tint);
  const activeTint = TINTS.some((o) => o.id === tint) ? tint : "signal";
  const font = useStore((s) => s.font) ?? "rounded";
  const size = useStore((s) => s.size) ?? "md";
  const { setTheme, setTint, setFont, setSize } = useStore.getState();
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    panel.current?.querySelector<HTMLElement>("button")?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { e.stopPropagation(); onClose(); } };
    window.addEventListener("keydown", onKey, true);
    return () => { window.removeEventListener("keydown", onKey, true); prev?.focus(); };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 px-4 pt-[12vh]" onMouseDown={onClose}>
      <div
        ref={panel}
        className="pop w-full max-w-md overflow-hidden rounded-2xl border border-line bg-panel"
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Appearance"
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <div className="text-sm font-medium">Appearance</div>
            <div className="text-xs text-muted">Saved on this machine</div>
          </div>
          <button onClick={onClose} className="rounded border border-line bg-panel2 px-1.5 font-mono text-[11px] text-faint transition-colors hover:text-fg">
            Esc
          </button>
        </div>

        <div className="flex flex-col gap-5 px-5 py-5">
          <Seg
            label="Theme"
            value={theme}
            options={[{ id: "dark", label: "Dark" }, { id: "light", label: "Light" }]}
            onChange={setTheme}
          />

          <div>
            <div className="mb-2 text-xs text-muted">Palette</div>
            <div role="radiogroup" aria-label="Palette" className="grid grid-cols-3 gap-1.5">
              {TINTS.map((opt) => {
                const on = opt.id === activeTint;
                return (
                  <button
                    key={opt.id}
                    role="radio"
                    aria-checked={on}
                    title={opt.hint}
                    onClick={() => setTint(opt.id)}
                    className={`flex flex-col items-center gap-2 rounded-lg border px-1 py-2 text-xs transition-colors ${
                      on ? "border-fg bg-hover text-fg" : "border-line text-muted hover:border-muted hover:text-fg"
                    }`}
                  >
                    <span aria-hidden className="h-5 w-5 rounded-full ring-1 ring-black/10" style={{ background: `linear-gradient(135deg, ${TINT_SWATCH[opt.id][0]} 50%, ${TINT_SWATCH[opt.id][1]} 50%)` }} />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="mb-2 text-xs text-muted">Typeface</div>
            <div role="radiogroup" aria-label="Typeface" className="grid grid-cols-2 gap-1.5">
              {FONTS.map((opt) => {
                const on = opt.id === font;
                return (
                  <button
                    key={opt.id}
                    role="radio"
                    aria-checked={on}
                    onClick={() => setFont(opt.id)}
                    style={{ fontFamily: FONT_FAMILY[opt.id] }}
                    className={`rounded-lg border px-3 py-2 text-left transition-colors ${
                      on ? "border-fg bg-hover" : "border-line hover:border-muted"
                    }`}
                  >
                    <span className="block text-sm font-medium">Aa 342</span>
                    <span className="block text-xs text-muted">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <Seg
            label="Size"
            value={size}
            options={SIZES}
            onChange={setSize}
          />
        </div>
      </div>
    </div>
  );
}
