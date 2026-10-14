import { ArrowRight, BookOpen, Terminal } from "lucide-react";
import Link from "next/link";
import { CodeBlock } from "./CodeBlock";
import { Reveal } from "./Reveal";

const STATS: [string, string][] = [
  ["4", "production stacks"],
  ["33", "files per scaffold"],
  ["30s", "idea → running app"],
  ["0", "config to write"],
];

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-36 pb-20 sm:pt-44 sm:pb-28">
      {/* backdrop */}
      <div className="bg-grid mask-fade-y absolute inset-0" aria-hidden />
      <div
        className="absolute left-1/2 top-[-320px] h-[560px] w-[820px] -translate-x-1/2 rounded-full bg-volt-400/10 blur-[140px]"
        aria-hidden
      />
      <div
        className="absolute right-[-180px] top-40 h-[380px] w-[380px] rounded-full bg-cyan-400/10 blur-[120px]"
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <div className="inline-flex items-center gap-2 rounded-full border border-volt-400/25 bg-volt-400/10 px-4 py-1.5 font-mono text-xs text-volt-300">
              <span className="h-1.5 w-1.5 animate-pulse-glow rounded-full bg-volt-400" />
              v0.1.0 — MERN · PERN · Hono · Go Fiber
            </div>
          </Reveal>

          <Reveal delay={90}>
            <h1 className="mt-7 text-balance text-5xl font-semibold leading-[1.04] tracking-tight text-zinc-50 sm:text-7xl">
              Full-stack apps,
              <br />
              <span className="text-glow text-volt-400">scaffolded right.</span>
            </h1>
          </Reveal>

          <Reveal delay={180}>
            <p className="mx-auto mt-6 max-w-xl text-pretty text-base leading-relaxed text-zinc-400 sm:text-lg">
              stackit is the <span className="text-zinc-200">create-next-app for backends</span> —
              pick MERN, PERN, Hono or Go Fiber and get a best-practice monorepo with auth-ready
              structure, validation, Docker and docs. In one command.
            </p>
          </Reveal>

          <Reveal delay={260}>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/docs"
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-volt-400 px-6 py-3.5 text-[15px] font-semibold text-zinc-950 transition-all hover:shadow-[0_0_40px_rgba(190,242,100,0.4)] sm:w-auto"
              >
                <Terminal className="h-4 w-4" />
                Scaffold my app
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/docs"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3.5 text-[15px] font-medium text-zinc-200 backdrop-blur transition-colors hover:border-white/30 hover:bg-white/10 sm:w-auto"
              >
                <BookOpen className="h-4 w-4" />
                Read the docs
              </Link>
            </div>
          </Reveal>
        </div>

        {/* terminal */}
        <Reveal delay={340} className="mx-auto mt-14 max-w-2xl">
          <div className="animate-float">
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0c0c0e]/90 shadow-[0_0_80px_rgba(190,242,100,0.12),0_32px_64px_rgba(0,0,0,0.6)] backdrop-blur">
              <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
                <span className="flex gap-1.5" aria-hidden>
                  <i className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                  <i className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                  <i className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                </span>
                <span className="ml-1 font-mono text-xs text-zinc-500">terminal — zsh</span>
              </div>
              <div className="px-5 py-5">
                <CodeBlock
                  compact
                  code={`$ bun run src/index.ts create my-app --stack mern --runtime bun -y
✔ Environment looks good
✔ Scaffolded 33 files → ./my-app
✔ Done! my-app (mern, typescript, bun)
$ cd my-app && bun run dev  # → client :5173 + api :5000`}
                />
                <p className="mt-3 font-mono text-xs text-zinc-600">
                  <span className="text-volt-400">▊</span>
                  <span className="animate-blink">_</span> zero config · prompts when you want them · flags when you don&apos;t
                </p>
              </div>
            </div>
          </div>
        </Reveal>

        {/* stats */}
        <Reveal delay={420}>
          <dl className="mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-4">
            {STATS.map(([v, l]) => (
              <div key={l} className="bg-[#0c0c0e] px-6 py-5 text-center">
                <dt className="order-2 mt-1 block text-xs text-zinc-500">{l}</dt>
                <dd className="font-mono text-2xl font-semibold text-volt-300">{v}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  );
}
