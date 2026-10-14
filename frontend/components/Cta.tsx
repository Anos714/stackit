import { ArrowRight, Terminal } from "lucide-react";
import Link from "next/link";
import { CodeBlock } from "./CodeBlock";
import { Reveal } from "./Reveal";

export function Cta() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-volt-400/25 bg-gradient-to-b from-volt-400/[0.12] to-transparent px-6 py-14 text-center sm:px-12 sm:py-20">
            <div className="bg-grid absolute inset-0 opacity-60" aria-hidden />
            <div
              className="absolute left-1/2 top-[-200px] h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-volt-400/15 blur-[120px]"
              aria-hidden
            />
            {/* animated bolt draw */}
            <svg
              className="pointer-events-none absolute -right-8 -top-8 h-48 w-48 opacity-30 sm:h-64 sm:w-64"
              viewBox="0 0 100 100"
              fill="none"
              aria-hidden
            >
              <path
                d="M55 8 30 55h16l-6 37 32-52H54l1-32Z"
                stroke="#bef264"
                strokeWidth="2.5"
                strokeLinejoin="round"
                className="draw-on"
              />
            </svg>
            <div className="relative">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-volt-300">
                $ stop configuring · start shipping
              </p>
              <h2 className="mx-auto mt-4 max-w-2xl font-display text-balance text-3xl font-semibold tracking-[-0.02em] text-zinc-50 sm:text-5xl">
                Your next full-stack app is one command away.
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-[15px] leading-relaxed text-zinc-400">
                Clone, install, scaffold. The backend boilerplate you&apos;ve written a hundred
                times — done right, in seconds.
              </p>
              <div className="mx-auto mt-8 max-w-xl text-left">
                <CodeBlock
                  code={`bunx create-stackit-app@latest create my-app --stack mern -y`}
                  title="terminal"
                />
              </div>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/docs"
                  className="btn-shine group flex items-center gap-2 rounded-xl bg-volt-400 px-6 py-3.5 text-[15px] font-semibold text-zinc-950 transition-all hover:shadow-[0_0_40px_rgba(190,242,100,0.4)]"
                >
                  <Terminal className="h-4 w-4 transition-transform duration-300 group-hover:rotate-[-8deg]" />
                  Read the quickstart
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
