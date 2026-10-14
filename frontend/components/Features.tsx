import { Database, Layers, Package, ShieldCheck, Terminal, Zap } from "lucide-react";
import { FEATURES } from "../lib/content";
import { Reveal, SectionHeading } from "./Reveal";
import { Spotlight } from "./Spotlight";

const ICONS: Record<string, React.ReactNode> = {
  layers: <Layers className="h-5 w-5" />,
  zap: <Zap className="h-5 w-5" />,
  shield: <ShieldCheck className="h-5 w-5" />,
  database: <Database className="h-5 w-5" />,
  terminal: <Terminal className="h-5 w-5" />,
  package: <Package className="h-5 w-5" />,
};

/** lg 6-col bento spans: [4,2] / [2,2,2] / [6 banner] */
const SPANS = [
  "sm:col-span-2 lg:col-span-4",
  "sm:col-span-2 lg:col-span-2",
  "sm:col-span-1 lg:col-span-2",
  "sm:col-span-1 lg:col-span-2",
  "sm:col-span-2 lg:col-span-2",
  "sm:col-span-2 lg:col-span-6",
];

function FileTree() {
  const rows: [string, string][] = [
    ["server/src/", "text-zinc-500"],
    ["├── app.ts", "text-zinc-300"],
    ["├── routes/", "text-zinc-300"],
    ["├── controllers/", "text-zinc-300"],
    ["├── models/", "text-volt-300"],
    ["└── middlewares/", "text-zinc-300"],
  ];
  return (
    <div className="mt-5 overflow-hidden rounded-xl border border-white/10 bg-black/50 p-4 font-mono text-[12.5px] leading-relaxed">
      {rows.map(([t, c]) => (
        <p key={t} className={c}>
          {t}
        </p>
      ))}
      <p className="mt-2 text-zinc-600">
        <span className="animate-blink text-volt-400">▊</span> no index.js dumping ground
      </p>
    </div>
  );
}

function DevCommand() {
  return (
    <div className="mt-5 flex flex-col gap-3 rounded-xl border border-white/10 bg-black/50 p-4 sm:flex-row sm:items-center">
      <code className="flex-1 overflow-x-auto whitespace-nowrap font-mono text-[13px] text-zinc-200">
        <span className="text-volt-400">$</span> bun run dev
      </code>
      <div className="flex shrink-0 gap-2 font-mono text-[11px]">
        <span className="rounded-full border border-volt-400/30 bg-volt-400/10 px-3 py-1 text-volt-300">
          client :5173
        </span>
        <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-cyan-300">
          api :5000
        </span>
      </div>
    </div>
  );
}

export function Features() {
  return (
    <section id="features" className="relative scroll-mt-28 py-20 sm:py-28">
      <div
        className="absolute left-1/2 top-0 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-volt-400/[0.06] blur-[130px]"
        aria-hidden
      />
      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHeading
          kicker="features"
          title={
            <>
              Everything a real project needs. <span className="text-volt-400">Nothing it doesn&apos;t.</span>
            </>
          }
          body="No 200-line tutorials to follow, no decisions to agonize over. The boring-but-critical parts are already done — correctly."
        />

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={(i % 3) * 90} className={`h-full ${SPANS[i]}`}>
              <Spotlight
                className={`h-full rounded-2xl border transition-all duration-300 hover:-translate-y-1 ${
                  i === FEATURES.length - 1
                    ? "border-volt-400/25 bg-gradient-to-r from-volt-400/[0.08] to-transparent hover:border-volt-400/40 hover:shadow-[0_0_40px_rgba(190,242,100,0.12)]"
                    : "border-white/10 bg-white/[0.02] hover:border-volt-400/30 hover:bg-volt-400/[0.04] hover:shadow-[0_0_40px_rgba(190,242,100,0.1)]"
                }`}
              >
                <article
                  className={`group h-full p-6 ${
                    i === FEATURES.length - 1 ? "sm:flex sm:items-center sm:gap-6" : ""
                  }`}
                >
                  <div className={i === FEATURES.length - 1 ? "min-w-0 flex-1" : ""}>
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-volt-400/25 bg-volt-400/10 text-volt-300 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[-6deg]">
                      {ICONS[f.icon]}
                    </div>
                    <h3 className="mt-5 font-display text-[17px] font-semibold tracking-[-0.01em] text-zinc-50">
                      {f.title}
                    </h3>
                    <p className="mt-2.5 text-sm leading-relaxed text-zinc-400">{f.body}</p>
                  </div>
                  {i === 0 && (
                    <div className="min-w-0 flex-1">
                      <FileTree />
                    </div>
                  )}
                  {i === FEATURES.length - 1 && (
                    <div className="min-w-0 flex-1">
                      <DevCommand />
                    </div>
                  )}
                </article>
              </Spotlight>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
