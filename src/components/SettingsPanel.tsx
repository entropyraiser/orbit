import { useEffect, useRef } from "react";
import { FONTS, SIZES, TINTS, useStore, type FontFace, type Tint } from "../lib/store";

const TINT_SWATCH: Record<Tint, string> = {
  none: "#eef0f3",
  mint: "#c8ead8",
  coral: "#f3d0d4",
  gold: "#f3efe4",
  violet: "#ddd6f5",
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
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</div>
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
              className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                on ? "border-transparent bg-fg text-bg shadow-md" : "border-line bg-panel2/70 text-muted hover:bg-hover hover:text-fg"
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
  const tint = useStore((s) => s.tint) ?? "none";
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
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/45 px-3 pt-[12vh] backdrop-blur-sm sm:px-4" onMouseDown={onClose}>
      <div
        ref={panel}
        className="pop w-full max-w-md overflow-hidden rounded-[28px] border border-line bg-panel shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Appearance"
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <div>
            <div className="text-sm font-extrabold tracking-tight">Appearance</div>
            <div className="text-[11px] text-muted">How the room feels. Saved on this machine.</div>
          </div>
          <button onClick={onClose} className="rounded-full border border-line px-2.5 py-1 text-[11px] font-bold text-muted hover:text-fg">
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
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">Backdrop</div>
            <p className="mb-2 text-[11px] leading-relaxed text-muted">The colour of the room behind the cards — including around the settings button.</p>
            <div role="radiogroup" aria-label="Backdrop" className="grid grid-cols-5 gap-1.5">
              {TINTS.map((opt) => {
                const on = opt.id === tint;
                return (
                  <button
                    key={opt.id}
                    role="radio"
                    aria-checked={on}
                    title={opt.hint}
                    onClick={() => setTint(opt.id)}
                    className={`flex flex-col items-center gap-1.5 rounded-2xl border px-1 py-2 text-[10px] font-bold transition ${
                      on ? "border-fg bg-hover text-fg" : "border-line text-muted hover:border-muted hover:text-fg"
                    }`}
                  >
                    <span aria-hidden className="h-6 w-6 rounded-full shadow-inner ring-1 ring-black/10" style={{ background: TINT_SWATCH[opt.id] }} />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">Typeface</div>
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
                    className={`rounded-2xl border px-3 py-2.5 text-left transition ${
                      on ? "border-fg bg-hover" : "border-line hover:border-muted"
                    }`}
                  >
                    <span className="block text-sm font-bold tracking-tight">Aa 342</span>
                    <span className="block text-[11px] text-muted">{opt.label}</span>
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
