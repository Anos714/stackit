import { Database, Layers, Package, ShieldCheck, Terminal, Zap } from "lucide-react";
import { FEATURES } from "../lib/content";
import { Reveal, SectionHeading } from "./Reveal";

const ICONS: Record<string, React.ReactNode> = {
  layers: <Layers className="h-5 w-5" />,
  zap: <Zap className="h-5 w-5" />,
  shield: <ShieldCheck className="h-5 w-5" />,
  database: <Database className="h-5 w-5" />,
  terminal: <Terminal className="h-5 w-5" />,
  package: <Package className="h-5 w-5" />,
};

export function Features() {
  return (
    <section id="features" className="relative scroll-mt-24 py-20 sm:py-28">
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

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={(i % 3) * 90}>
              <article className="group h-full rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-volt-400/30 hover:bg-volt-400/[0.04] hover:shadow-[0_0_40px_rgba(190,242,100,0.1)]">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-volt-400/25 bg-volt-400/10 text-volt-300 transition-transform duration-300 group-hover:scale-110">
                  {ICONS[f.icon]}
                </div>
                <h3 className="mt-5 text-[17px] font-semibold tracking-tight text-zinc-50">
                  {f.title}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-zinc-400">{f.body}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
