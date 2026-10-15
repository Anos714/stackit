"use client";

import { Check, Cpu, Database, FileCode2, Server } from "lucide-react";
import { useState } from "react";
import { STACKS } from "../lib/content";
import { CodeBlock } from "./CodeBlock";
import { Reveal, SectionHeading } from "./Reveal";
import { Spotlight } from "./Spotlight";

export function StackTabs() {
  const [active, setActive] = useState(STACKS[0].id);
  const stack = STACKS.find((s) => s.id === active)!;

  return (
    <section id="stacks" className="relative scroll-mt-28 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHeading
          kicker="stacks"
          title={
            <>
              One CLI. <span className="text-volt-400">Four production stacks.</span>
            </>
          }
          body="Every stack ships a Vite + React frontend and a layered backend with validation, env handling and Docker. Pick a tab to see exactly what you get."
        />

        {/* tabs */}
        <Reveal delay={120}>
          <div
            role="tablist"
            aria-label="Stacks"
            className="mask-fade-x mt-10 flex gap-2 overflow-x-auto pb-2 sm:flex-wrap sm:justify-center"
          >
            {STACKS.map((s) => {
              const on = s.id === active;
              return (
                <button
                  key={s.id}
                  role="tab"
                  aria-selected={on}
                  onClick={() => setActive(s.id)}
                  className={`shrink-0 rounded-xl border px-5 py-3 text-sm font-medium transition-all ${
                    on
                      ? "border-volt-400/50 bg-volt-400/10 text-volt-300 shadow-[0_0_24px_rgba(190,242,100,0.15)]"
                      : "border-white/10 bg-white/[0.03] text-zinc-400 hover:border-white/25 hover:text-zinc-200"
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </Reveal>

        {/* panel */}
        <Reveal delay={180}>
          <Spotlight
            key={stack.id}
            className="mt-6 grid gap-5 rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition-colors duration-300 hover:border-volt-400/20 sm:p-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap gap-2">
                {stack.highlight.map((h) => (
                  <span
                    key={h}
                    className="rounded-full border border-volt-400/30 bg-volt-400/10 px-3 py-1 font-mono text-[11px] text-volt-300"
                  >
                    {h}
                  </span>
                ))}
              </div>
              <h3 className="mt-4 font-display text-2xl font-semibold tracking-[-0.01em] text-zinc-50">
                {stack.label}
              </h3>
              <p className="mt-2 text-[15px] leading-relaxed text-zinc-400">{stack.tagline}</p>

              <div className="mt-6 grid grid-cols-1 gap-3 min-[480px]:grid-cols-3">
                <Meta icon={<Server className="h-4 w-4" />} label="Backend" value={stack.backend} />
                <Meta icon={<Database className="h-4 w-4" />} label="Database" value={stack.database} />
                <Meta icon={<Cpu className="h-4 w-4" />} label="Runtime" value={stack.runtime} />
              </div>

              <ul className="mt-6 space-y-2.5">
                {stack.files.map((f) => (
                  <li key={f.path} className="flex min-w-0 flex-wrap items-baseline gap-x-2.5 gap-y-0.5 text-sm">
                    <Check className="h-4 w-4 shrink-0 translate-y-[3px] text-volt-400" />
                    <span className="break-all font-mono text-[13px] text-zinc-200">{f.path}</span>
                    <span className="break-words text-zinc-500">— {f.note}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex min-w-0 flex-col gap-4">
              <div>
                <p className="mb-2 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-zinc-500">
                  <FileCode2 className="h-3.5 w-3.5" /> scaffold it <span className="text-zinc-600">· via bunx, no install</span>
                </p>
                <CodeBlock code={stack.command} title={`terminal — ${stack.id}`} />
              </div>
              <div className="flex-1 rounded-xl border border-white/10 bg-black/40 p-4 font-mono text-xs leading-loose text-zinc-500">
                <p className="text-zinc-600"># then</p>
                <p>
                  <span className="text-volt-400">$</span> cd {stack.id === "mern" ? "my-app" : stack.id === "pern" ? "shop-api" : stack.id === "hono-pg" ? "edge-api" : "fast-api"}
                </p>
                <p>
                  <span className="text-volt-400">$</span> docker compose up -d
                </p>
                <p>
                  <span className="text-volt-400">$</span> bun run dev
                </p>
                <p className="mt-2 text-zinc-600">→ frontend :5173 · api :5000 · health /api/health</p>
              </div>
            </div>
          </Spotlight>
        </Reveal>
      </div>
    </section>
  );
}

function Meta({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/40 p-3">
      <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-zinc-500">
        {icon}
        {label}
      </p>
      <p className="mt-1.5 text-[13px] font-medium leading-snug text-zinc-200">{value}</p>
    </div>
  );
}
