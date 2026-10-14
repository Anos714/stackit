"use client";

import { useEffect, useRef, type CSSProperties } from "react";

export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${className}`}
      style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}

export function SectionHeading({
  kicker,
  title,
  body,
  align = "center",
}: {
  kicker: string;
  title: React.ReactNode;
  body?: string;
  align?: "center" | "left";
}) {
  const centered = align === "center";
  return (
    <Reveal className={centered ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <p
        className={`font-mono text-xs font-medium uppercase tracking-[0.2em] text-volt-400 ${centered ? "" : ""}`}
      >
        <span className="text-zinc-600">$ </span>
        {kicker}
      </p>
      <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
        {title}
      </h2>
      {body && <p className="mt-4 text-pretty text-base leading-relaxed text-zinc-400">{body}</p>}
    </Reveal>
  );
}
