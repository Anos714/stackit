import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { ArrowRight, BookOpen, Home } from "lucide-react";
import Link from "next/link";
import { LostRoute } from "../components/LostRoute";

export const metadata: Metadata = {
  title: "404 — page not found",
  robots: { index: false, follow: false },
};

const REAL_PAGES = [
  { href: "/#stacks", label: "Stacks" },
  { href: "/#features", label: "Features" },
  { href: "/#workflow", label: "Workflow" },
  { href: "/#faq", label: "FAQ" },
  { href: "/docs", label: "Docs" },
];

export default function NotFound() {
  return (
    <section className="relative flex min-h-[82svh] items-center overflow-hidden py-20 sm:py-24">
      {/* backdrop */}
      <div className="bg-grid mask-fade-y absolute inset-0" aria-hidden />
      <div
        className="absolute left-1/2 top-[-240px] h-[520px] w-[760px] -translate-x-1/2 rounded-full bg-volt-400/10 blur-[140px]"
        aria-hidden
      />
      <div
        className="absolute bottom-[-140px] right-[-160px] h-[360px] w-[360px] rounded-full bg-cyan-400/10 blur-[120px]"
        aria-hidden
      />

      {/* orbit ring */}
      <svg
        className="pointer-events-none absolute left-1/2 top-1/2 h-[560px] w-[1000px] -translate-x-1/2 -translate-y-1/2 opacity-30"
        viewBox="0 0 1000 560"
        fill="none"
        aria-hidden
      >
        <g className="animate-spin-slow">
          <ellipse
            cx="500"
            cy="280"
            rx="430"
            ry="220"
            stroke="#bef264"
            strokeOpacity="0.25"
            strokeDasharray="5 12"
          />
          <circle cx="500" cy="60" r="4" fill="#bef264" />
          <circle cx="930" cy="280" r="3" fill="#22d3ee" />
        </g>
        <ellipse cx="500" cy="280" rx="300" ry="150" stroke="white" strokeOpacity="0.06" />
      </svg>

      {/* drifting code glyphs */}
      <span
        aria-hidden
        className="pointer-events-none absolute left-[7%] top-[20%] hidden animate-float font-mono text-2xl text-volt-400/20 md:block"
      >
        {"{}"}
      </span>
      <span
        aria-hidden
        className="pointer-events-none absolute right-[9%] top-[30%] hidden animate-float font-mono text-xl text-cyan-300/15 md:block"
        style={{ animationDelay: "-2.4s" }}
      >
        {"</>"}
      </span>
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-[18%] left-[13%] hidden animate-float font-mono text-3xl text-white/10 md:block"
        style={{ animationDelay: "-4.2s" }}
      >
        ;
      </span>

      <div className="relative mx-auto w-full max-w-3xl px-5 text-center sm:px-8">
        <p
          className="rise font-mono text-xs uppercase tracking-[0.2em] text-volt-300"
          style={{ "--rise-delay": "40ms" } as CSSProperties}
        >
          <span className="text-zinc-600">$ </span>stackit locate --route
        </p>

        <div className="relative mt-5">
          <h1
            className="rise digits relative"
            style={{ "--rise-delay": "120ms" } as CSSProperties}
          >
            <span className="sr-only">404 — page not found</span>
            <span
              aria-hidden
              className="flex items-center justify-center gap-[0.05em] font-display text-[clamp(5.5rem,26vw,11.5rem)] font-bold leading-[0.9] tracking-[-0.06em]"
            >
              <span className="digit-ghost">4</span>
              <span className="relative inline-block px-[0.04em] text-volt-400 text-glow">
                0
                <svg
                  className="pointer-events-none absolute left-1/2 top-1/2 h-[0.92em] w-[0.92em] -translate-x-1/2 -translate-y-1/2 animate-spin-slow"
                  viewBox="0 0 100 100"
                  fill="none"
                >
                  <circle
                    cx="50"
                    cy="50"
                    r="47"
                    stroke="#bef264"
                    strokeOpacity="0.4"
                    strokeWidth="1.4"
                    strokeDasharray="3 9"
                  />
                  <circle cx="50" cy="3" r="2.6" fill="#bef264" />
                </svg>
              </span>
              <span className="digit-ghost">4</span>
            </span>
          </h1>

          <span className="pointer-events-none absolute -right-2 -top-1 hidden rotate-[-7deg] rounded-md border border-dashed border-volt-400/40 bg-[#09090b] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-volt-300/80 sm:inline-block">
            route not found
          </span>
        </div>

        <p
          className="rise mx-auto mt-6 max-w-xl text-balance font-display text-2xl font-semibold tracking-[-0.015em] text-zinc-50 sm:text-[1.75rem]"
          style={{ "--rise-delay": "200ms" } as CSSProperties}
        >
          This page never made it past the scaffold.
        </p>
        <p
          className="rise mx-auto mt-3 max-w-md text-pretty text-[15px] leading-relaxed text-zinc-400"
          style={{ "--rise-delay": "260ms" } as CSSProperties}
        >
          The link is stale, the route moved, or the URL grew a typo. Pick a real page below and
          get back to shipping.
        </p>

        <div
          className="rise mx-auto mt-8 max-w-xl"
          style={{ "--rise-delay": "320ms" } as CSSProperties}
        >
          <LostRoute />
        </div>

        <div
          className="rise mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row"
          style={{ "--rise-delay": "380ms" } as CSSProperties}
        >
          <Link
            href="/"
            className="btn-shine group flex w-full items-center justify-center gap-2 rounded-xl bg-volt-400 px-6 py-3.5 text-[15px] font-semibold text-zinc-950 transition-all hover:shadow-[0_0_40px_rgba(190,242,100,0.4)] sm:w-auto"
          >
            <Home className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5" />
            Back to home
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
          <Link
            href="/docs"
            className="group flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3.5 text-[15px] font-medium text-zinc-200 backdrop-blur transition-all hover:border-white/30 hover:bg-white/10 active:scale-[0.98] sm:w-auto"
          >
            <BookOpen className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5" />
            Read the docs
          </Link>
        </div>

        <div
          className="rise mt-9"
          style={{ "--rise-delay": "440ms" } as CSSProperties}
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-600">
            <span className="text-zinc-700">{"//"}</span> pages that do exist
          </p>
          <nav className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
            {REAL_PAGES.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 font-mono text-[11px] text-zinc-400 transition-all hover:-translate-y-0.5 hover:border-volt-400/40 hover:bg-white/[0.06] hover:text-volt-300"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        <p
          className="rise mt-10 font-mono text-[11px] text-zinc-700"
          style={{ "--rise-delay": "500ms" } as CSSProperties}
        >
          {"// E404 · no stack trace available"}
        </p>
      </div>
    </section>
  );
}
