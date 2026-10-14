import { ArrowLeft, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { CodeBlock } from "../../components/CodeBlock";
import { Reveal } from "../../components/Reveal";
import { FLAGS, STACKS } from "../../lib/content";

export const metadata = {
  title: "Docs — stackit",
  description: "How to install, use and understand stackit: commands, flags, stacks and generated structure.",
};

const SECTIONS = [
  { id: "install", label: "Installation" },
  { id: "quickstart", label: "Quickstart" },
  { id: "commands", label: "Commands & flags" },
  { id: "stacks", label: "Stacks" },
  { id: "structure", label: "Generated structure" },
  { id: "run", label: "Running it" },
  { id: "troubleshooting", label: "Troubleshooting" },
];

export default function DocsPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 pb-24 pt-28 sm:px-8 sm:pt-32">
      <Reveal>
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-mono text-xs text-zinc-500 transition-colors hover:text-volt-300"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> back home
        </Link>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-zinc-50 sm:text-5xl">
          Documentation
        </h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-zinc-400">
          Install it, scaffold with it, run what it generates. Everything below mirrors the
          CLI&apos;s real behavior.
        </p>
      </Reveal>

      <div className="mt-10 grid gap-10 lg:grid-cols-[220px_1fr]">
        {/* sidebar */}
        <aside className="hidden lg:block">
          <nav className="sticky top-24 space-y-1">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="block rounded-lg px-3 py-2 font-mono text-[13px] text-zinc-500 transition-colors hover:bg-white/5 hover:text-volt-300"
              >
                <span className="text-zinc-700">§ </span>
                {s.label}
              </a>
            ))}
          </nav>
        </aside>

        <div className="min-w-0 space-y-14">
          <DocSection id="install" kicker="install" title="Installation">
            <p>You need Bun 1.2+ to run the CLI. Then:</p>
            <CodeBlock
              title="terminal"
              code={`git clone <your-repo-url> stackit
cd stackit
bun install`}
            />
            <p>
              That&apos;s it — no global install, no published package yet. Per-stack runtimes
              (Node 20+, Bun 1.2+, Go 1.24+) are checked automatically before scaffolding.
            </p>
          </DocSection>

          <DocSection id="quickstart" kicker="quickstart" title="Quickstart">
            <p>Interactive mode asks 4 questions — stack, language, runtime, package manager:</p>
            <CodeBlock title="terminal" code={`bun run src/index.ts create my-app`} />
            <p>Fully non-interactive with flags (great for scripts and CI):</p>
            <CodeBlock
              title="terminal"
              code={`# MERN + Bun + TypeScript, zero prompts
bun run src/index.ts create my-app --stack mern --language typescript --runtime bun --pm bun -y

# PERN + Node + JavaScript, skip install & git (fastest)
bun run src/index.ts create shop-api --stack pern --language javascript --runtime node --pm npm -y --no-install --no-git

# Go + Fiber (language/runtime auto-resolve to go)
bun run src/index.ts create fast-api --stack go-fiber -y`}
            />
          </DocSection>

          <DocSection id="commands" kicker="commands" title="Commands & flags">
            <p>
              One command exists today — <code>create</code>. Flags always win over prompts;
              invalid combos are rejected instead of generating broken projects.
            </p>
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.03] font-mono text-[11px] uppercase tracking-widest text-zinc-500">
                    <th className="px-4 py-3">Flag</th>
                    <th className="px-4 py-3">Values</th>
                    <th className="px-4 py-3">Default</th>
                  </tr>
                </thead>
                <tbody>
                  {FLAGS.map((f) => (
                    <tr key={f.flag} className="border-b border-white/5 last:border-0">
                      <td className="px-4 py-3 font-mono text-[13px] text-volt-300">{f.flag}</td>
                      <td className="px-4 py-3 text-zinc-400">{f.values}</td>
                      <td className="px-4 py-3 text-zinc-500">{f.def}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DocSection>

          <DocSection id="stacks" kicker="stacks" title="Stacks">
            <p>Four stacks, each a Vite + React frontend plus a backend with its own database:</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {STACKS.map((s) => (
                <div key={s.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
                  <h3 className="font-semibold text-zinc-50">{s.label}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-zinc-400">{s.tagline}</p>
                  <dl className="mt-3 space-y-1 font-mono text-xs">
                    <div className="flex gap-2">
                      <dt className="w-20 shrink-0 text-zinc-600">backend</dt>
                      <dd className="text-zinc-300">{s.backend}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="w-20 shrink-0 text-zinc-600">database</dt>
                      <dd className="text-zinc-300">{s.database}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="w-20 shrink-0 text-zinc-600">runtime</dt>
                      <dd className="text-zinc-300">{s.runtime}</dd>
                    </div>
                  </dl>
                </div>
              ))}
            </div>
          </DocSection>

          <DocSection id="structure" kicker="structure" title="Generated structure">
            <p>JS stacks (mern / pern / hono-pg) share this layout — TypeScript just swaps extensions and adds tsconfigs:</p>
            <CodeBlock
              title="my-app/"
              lang="text"
              code={`my-app/
├── client/                  # Vite + React (proxies /api → :5000)
│   └── src/{App, main, lib/api}
├── server/                  # Express / Hono API
│   └── src/
│       ├── index.*          # entrypoint (env → connect → listen)
│       ├── app.*            # app factory (middleware + routes)
│       ├── config/          # env, db connection
│       ├── routes/          # health, users
│       ├── controllers/     # handlers (express)
│       ├── models/          # mongoose schema / SQL DDL
│       ├── middlewares/     # errorHandler, notFound, zod validation
│       └── utils/           # asyncHandler, ApiError
├── docker-compose.yml       # one-command Mongo / Postgres
└── .env.example`}
            />
            <p>Go + Fiber instead generates <code>server/cmd/api/main.go</code> plus <code>server/internal/{"{config,db,handlers,middleware,models,routes}"}</code> and a Makefile.</p>
          </DocSection>

          <DocSection id="run" kicker="run" title="Running it">
            <CodeBlock
              title="terminal"
              code={`cd my-app
cp .env.example server/.env   # fill in MONGO_URI / DATABASE_URL
docker compose up -d          # starts MongoDB / PostgreSQL
bun run dev                   # (or npm/pnpm/yarn run dev) → client + server`}
            />
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ["Frontend", "http://localhost:5173"],
                ["API", "http://localhost:5000"],
                ["Health", "http://localhost:5000/api/health"],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl border border-white/10 bg-black/40 p-4">
                  <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">{k}</p>
                  <p className="mt-1 font-mono text-[13px] text-volt-300">{v}</p>
                </div>
              ))}
            </div>
            <p>
              Go stacks: <code>cd server && go mod tidy && go run ./cmd/api</code>, or everything
              via <code>make dev</code>. Without <code>DATABASE_URL</code> the API runs in demo
              mode (in-memory store); set it for real Postgres persistence.
            </p>
          </DocSection>

          <DocSection id="troubleshooting" kicker="troubleshooting" title="Troubleshooting">
            <div className="space-y-3">
              <Note title="“X is not installed” before scaffolding">
                The CLI checks the runtime your stack needs. Install what it names (it prints the
                exact hint, e.g. Node LTS ≥ 20) and re-run. Package-manager gaps are warnings only.
              </Note>
              <Note title="Server exits: Missing env var …">
                You skipped copying the env file. <code>cp .env.example server/.env</code> and fill
                in <code>MONGO_URI</code> or <code>DATABASE_URL</code> — boot fails fast on purpose.
              </Note>
              <Note title="API connects nowhere / users endpoints 500">
                The database isn&apos;t reachable. <code>docker compose up -d</code> from the project
                root, then confirm the port (27017 mongo / 5432 postgres) matches your env.
              </Note>
              <Note title="Vite shows the demo page but “API: …” never loads">
                The dev proxy points at <code>http://localhost:5000</code>. Make sure the server is
                running, or set <code>VITE_API_URL</code> in <code>client/.env</code>.
              </Note>
            </div>
          </DocSection>
        </div>
      </div>
    </div>
  );
}

function DocSection({
  id,
  kicker,
  title,
  children,
}: {
  id: string;
  kicker: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28">
      <Reveal>
        <p className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-volt-400">
          <span className="text-zinc-600">$ </span>
          {kicker}
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
          {title}
        </h2>
        <div className="mt-5 space-y-4 text-[15px] leading-relaxed text-zinc-400 [&_code]:rounded [&_code]:bg-white/10 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[13px] [&_code]:text-volt-300 [&_p]:text-pretty">
          {children}
        </div>
      </Reveal>
    </section>
  );
}

function Note({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-xl border border-amber-400/20 bg-amber-400/[0.05] p-4">
      <TriangleAlert className="h-4 w-4 shrink-0 text-amber-300" />
      <div className="text-sm leading-relaxed text-zinc-400">
        <p className="font-medium text-zinc-200">{title}</p>
        <div className="mt-1 [&_code]:rounded [&_code]:bg-white/10 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs [&_code]:text-volt-300">
          {children}
        </div>
      </div>
    </div>
  );
}
