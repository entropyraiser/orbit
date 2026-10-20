import { useEffect, useRef, useState } from "react";
import { fmtPrice } from "../lib/format";

/** Price that smoothly counts toward its new value on every poll (instant under reduced-motion). */
export default function AnimatedPrice({ value, className }: { value?: number; className?: string }) {
  const [display, setDisplay] = useState(value);
  const from = useRef(value);
  const raf = useRef(0);

  useEffect(() => {
    if (value == null) return;
    const start = from.current;
    if (start == null || start === value || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      from.current = value; setDisplay(value); return;
    }
    const t0 = performance.now(), dur = 550;
    cancelAnimationFrame(raf.current);
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      const v = start + (value - start) * e;
      setDisplay(v);
      if (p < 1) raf.current = requestAnimationFrame(tick); else from.current = value;
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [value]);

  if (value == null) return <span className="skeleton inline-block h-12 w-48 align-middle lg:h-14" />;
  return <span className={className}>{fmtPrice(display)}</span>;
}
