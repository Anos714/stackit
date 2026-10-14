"use client";

import { useEffect, useState } from "react";

/** Thin reading-progress bar pinned under the navbar. */
export function ReadingProgress() {
  const [p, setP] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      setP(max > 0 ? Math.min(h.scrollTop / max, 1) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="fixed inset-x-0 top-16 z-40 h-px bg-transparent" aria-hidden>
      <div
        className="h-full origin-left bg-gradient-to-r from-volt-500 via-volt-400 to-cyan-300 shadow-[0_0_12px_rgba(190,242,100,0.7)]"
        style={{ transform: `scaleX(${p})` }}
      />
    </div>
  );
}

/** Sidebar TOC with the section in view highlighted. */
export function DocsSidebar({ sections }: { sections: { id: string; label: string }[] }) {
  const [active, setActive] = useState(sections[0]?.id);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(e.target.id);
        }
      },
      { rootMargin: "-20% 0px -70% 0px" },
    );
    for (const s of sections) {
      const el = document.getElementById(s.id);
      if (el) obs.observe(el);
    }
    return () => obs.disconnect();
  }, [sections]);

  return (
    <nav className="sticky top-24 space-y-1" aria-label="On this page">
      <p className="px-3 pb-2 font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-600">
        On this page
      </p>
      {sections.map((s) => {
        const on = active === s.id;
        return (
          <a
            key={s.id}
            href={`#${s.id}`}
            aria-current={on ? "true" : undefined}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 font-mono text-[13px] transition-all ${
              on
                ? "bg-volt-400/10 text-volt-300"
                : "text-zinc-500 hover:bg-white/5 hover:text-zinc-200"
            }`}
          >
            <span
              className={`h-3 w-px rounded-full transition-colors ${on ? "bg-volt-400" : "bg-zinc-700"}`}
            />
            {s.label}
          </a>
        );
      })}
    </nav>
  );
}
