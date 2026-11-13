import { ArrowUpRight, Coffee, Package, Plus } from "lucide-react";
import { Reveal } from "./Reveal";

const MAILTO =
  "mailto:sainrahul374@gmail.com?subject=Sponsoring%20stackit&body=Hey%20Rahul%2C%0A%0AI%27d%20like%20to%20sponsor%20stackit.%20Here%27s%20what%20I%20had%20in%20mind%3A%0A%0A";

const SLOT_COUNT = 6;

const SPONSORS = [
  {
    name: "Kilosmith",
    note: "Heavy files, made light.",
    href: "https://kilosmith.vercel.app/",
  },
];

const SUPPORT = [
  {
    label: "Star stackit on GitHub",
    href: "https://github.com/Anos714/stackit",
    icon: <GithubMark />,
  },
  {
    label: "create-stackit-app on npm",
    href: "https://www.npmjs.com/package/create-stackit-app",
    icon: <Package className="h-5 w-5" />,
  },
  {
    label: "Buy Rahul a coffee",
    href: "https://buymeacoffee.com/anos714",
    icon: <Coffee className="h-5 w-5" />,
  },
];

export function Sponsors() {
  const openSlots = SLOT_COUNT - SPONSORS.length;

  return (
    <section id="sponsors" className="relative scroll-mt-28 border-t border-white/10 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal>
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-volt-400">
                <span className="text-zinc-600">$ </span>sponsors
              </p>
              <h2 className="mt-4 font-display text-4xl font-semibold tracking-[-0.02em] text-zinc-50 sm:text-5xl">
                Sponsors<span className="text-volt-400">.</span>
              </h2>
              <p className="mt-5 max-w-md text-pretty text-[15px] leading-relaxed text-zinc-400">
                stackit is built by one developer and stays free for everyone. Sponsors cover the
                time that goes into new stacks, docs and releases.
              </p>
              <p className="mt-4 text-[13px] leading-relaxed text-zinc-500">
                <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-volt-300">
                  $10 one-time
                </span>
                <span className="mx-2 text-zinc-700">/</span>
                logo tile + link to your site, live within an hour.
              </p>
              <a
                href={MAILTO}
                className="group mt-7 inline-flex items-center gap-1.5 border-b border-volt-400/35 pb-1 font-mono text-[13px] text-volt-300 transition-colors hover:border-volt-400"
              >
                Become a sponsor
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
            </div>

            <div className="sm:max-w-[640px] lg:col-span-7">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                  {openSlots} slots open
                </p>
                <p className="text-xs text-zinc-500">your logo goes here</p>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-6">
                {SPONSORS.map((s) => (
                  <a
                    key={s.name}
                    href={s.href}
                    target="_blank"
                    rel="noreferrer"
                    title={`${s.name} — ${s.note}`}
                    aria-label={`${s.name} — ${s.note}`}
                    className="group relative flex aspect-square flex-col items-center justify-center gap-1.5 rounded-2xl border border-[#ffd23f]/30 bg-[#fff9ee] px-2 transition-all duration-300 ease-out hover:-translate-y-1 hover:border-[#ffd23f] hover:shadow-[0_16px_36px_rgba(0,0,0,0.45)] focus-visible:-translate-y-1 focus-visible:ring-2 focus-visible:ring-volt-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090b] focus-visible:outline-none"
                  >
                    <svg
                      viewBox="10 14 44 40"
                      aria-hidden
                      className="h-[42%] w-auto transition-transform duration-300 ease-out group-hover:-rotate-6 group-hover:scale-105 group-focus-visible:-rotate-6 group-focus-visible:scale-105"
                    >
                      <rect x="12" y="16" width="40" height="10" rx="5" fill="#ffd23f" />
                      <rect x="12" y="29" width="28" height="10" rx="5" fill="#a9c7ff" />
                      <rect x="12" y="42" width="15" height="10" rx="5" fill="#ff5ca8" />
                    </svg>
                    <span className="font-display text-[9px] font-semibold leading-none tracking-[-0.01em] text-[#221139] sm:text-[10px]">
                      {s.name}
                    </span>
                    <ArrowUpRight className="pointer-events-none absolute right-1.5 top-1.5 h-3.5 w-3.5 -translate-y-1 text-[#221139]/35 opacity-0 transition-all duration-300 ease-out group-hover:translate-y-0 group-hover:text-[#221139] group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100" />
                  </a>
                ))}
                {Array.from({ length: openSlots }, (_, i) => (
                  <a
                    key={`open-${i}`}
                    href={MAILTO}
                    aria-label={`Sponsor slot ${SPONSORS.length + i + 1} — email Rahul about sponsoring stackit`}
                    className="group flex aspect-square items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.02] transition-colors duration-300 hover:border-volt-400/50 hover:bg-volt-400/[0.05]"
                  >
                    <Plus className="h-5 w-5 text-zinc-600 transition-all duration-300 group-hover:rotate-90 group-hover:text-volt-300" />
                  </a>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3">
                <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                  support the project
                </span>
                <div className="flex items-center gap-2">
                  {SUPPORT.map((item) => (
                    <a
                      key={item.label}
                      href={item.href}
                      target="_blank"
                      rel="noreferrer"
                      title={item.label}
                      aria-label={item.label}
                      className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-[#0c0c0e] text-zinc-400 transition-all duration-300 hover:-translate-y-0.5 hover:border-volt-400/40 hover:text-volt-300"
                    >
                      {item.icon}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-14 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
            <p className="text-sm text-zinc-500">
              Thank you to everyone who has starred, shared or shipped with stackit.
            </p>
            <p className="font-mono text-xs text-zinc-500">— Rahul</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function GithubMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
      <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-2.17c-3.2.7-3.88-1.36-3.88-1.36-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 2.9-.39c.98 0 1.97.13 2.9.39 2.21-1.49 3.18-1.18 3.18-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.69 5.41-5.25 5.69.41.35.78 1.05.78 2.12v3.14c0 .31.21.68.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z" />
    </svg>
  );
}
