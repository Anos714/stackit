import { Zap } from "lucide-react";

const ITEMS = [
  "MERN",
  "PERN",
  "Hono + Postgres",
  "Go + Fiber",
  "Bun-first",
  "TypeScript",
  "Vite + React",
  "MongoDB",
  "PostgreSQL",
  "Docker",
  "zod validation",
  "CI-ready -y",
];

export function Ticker() {
  const row = (hidden: boolean) => (
    <div className="flex shrink-0 items-center" aria-hidden={hidden}>
      {ITEMS.map((t) => (
        <span key={t + (hidden ? "-b" : "-a")} className="flex items-center">
          <span className="whitespace-nowrap px-6 font-mono text-[13px] uppercase tracking-[0.18em] text-zinc-500 transition-colors hover:text-volt-300">
            {t}
          </span>
          <Zap className="h-3.5 w-3.5 shrink-0 text-volt-400/60" fill="currentColor" />
        </span>
      ))}
    </div>
  );

  return (
    <div className="relative border-y border-white/10 bg-white/[0.015] py-5">
      <div className="mask-fade-x overflow-hidden">
        <div className="flex w-max animate-marquee">
          {row(false)}
          {row(true)}
        </div>
      </div>
    </div>
  );
}
