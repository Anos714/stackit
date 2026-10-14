import { DEMO_API, SCAFFOLD_OUTPUT } from "../lib/content";
import { CodeBlock } from "./CodeBlock";
import { Reveal, SectionHeading } from "./Reveal";

const STEPS = [
  {
    n: "01",
    title: "Answer 4 questions",
    body: "Stack, language, runtime, package manager. Or skip it all with -y and flags — CI-friendly by design.",
  },
  {
    n: "02",
    title: "CLI checks your machine",
    body: "Node, Bun, Go versions verified before a single file is written. Missing something? You get the exact install hint.",
  },
  {
    n: "03",
    title: "Code, install, git — done",
    body: "33 best-practice files, dependencies installed, repo initialized. cd in and run dev. That's the whole workflow.",
  },
];

export function Workflow() {
  return (
    <section id="workflow" className="relative scroll-mt-28 border-y border-white/10 bg-white/[0.015] py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHeading
          kicker="workflow"
          title={
            <>
              Idea to running app <span className="text-volt-400">in 30 seconds.</span>
            </>
          }
          body="Three steps. No Yeoman generators to debug, no wiki pages to read, no 'now wire up CORS' left as an exercise."
        />

        <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <ol className="space-y-2">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 100}>
                <li className="group flex gap-5 rounded-2xl border border-transparent p-5 transition-colors hover:border-white/10 hover:bg-white/[0.02]">
                  <span className="font-mono text-sm font-semibold text-volt-400">{s.n}</span>
                  <div>
                    <h3 className="text-[17px] font-semibold tracking-tight text-zinc-50">
                      {s.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">{s.body}</p>
                  </div>
                </li>
              </Reveal>
            ))}
          </ol>

          <Reveal delay={150}>
            <div className="space-y-4">
              <CodeBlock code={SCAFFOLD_OUTPUT} title="terminal — create my-app" lang="text" />
              <CodeBlock code={DEMO_API} title="client/src/lib/api.ts" lang="ts" />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
