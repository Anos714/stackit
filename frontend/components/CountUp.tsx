"use client";

import { useEffect, useRef, useState } from "react";

/** Animates 0 → value when scrolled into view (respects reduced motion). */
export function CountUp({
  value,
  suffix = "",
  duration = 1200,
}: {
  value: number;
  suffix?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [n, setN] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !started.current) {
          started.current = true;
          if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            setN(value);
            return;
          }
          const t0 = performance.now();
          const tick = (t: number) => {
            const p = Math.min((t - t0) / duration, 1);
            setN(Math.round(value * (1 - Math.pow(1 - p, 3))));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [value, duration]);

  return (
    <span ref={ref}>
      {n}
      {suffix}
    </span>
  );
}
