import { Star } from "lucide-react";
import Link from "next/link";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="border-t border-white/10">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo compact />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-zinc-500">
              Opinionated full-stack scaffolder. MERN, PERN, Hono + Postgres, Go + Fiber — one
              command, best-practice repo.
            </p>
            <div className="mt-5 flex items-center gap-2 font-mono text-xs text-zinc-600">
              <span className="h-2 w-2 animate-pulse-glow rounded-full bg-volt-400" />
              bun · next.js · tailwind
            </div>
          </div>

          <FooterCol
            title="Product"
            links={[
              ["Stacks", "/#stacks"],
              ["Features", "/#features"],
              ["Workflow", "/#workflow"],
              ["FAQ", "/#faq"],
            ]}
          />
          <FooterCol
            title="Docs"
            links={[
              ["Getting started", "/docs#install"],
              ["Commands & flags", "/docs#commands"],
              ["Generated structure", "/docs#structure"],
              ["Troubleshooting", "/docs#troubleshooting"],
            ]}
          />
          <FooterCol
            title="Project"
            links={[
              ["README", "/docs"],
              ["GitHub", "https://github.com"],
            ]}
          />
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row sm:items-center">
          <p className="text-xs text-zinc-600">© 2026 stackit — scaffold fast, ship faster.</p>
          <a
            href="https://github.com"
            className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-zinc-400 transition-colors hover:border-volt-400/40 hover:text-volt-300"
          >
            <Star className="h-3.5 w-3.5" /> Star on GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h4 className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500">
        {title}
      </h4>
      <ul className="mt-4 space-y-2.5">
        {links.map(([label, href]) => (
          <li key={label}>
            <Link href={href} className="text-sm text-zinc-400 transition-colors hover:text-volt-300">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
