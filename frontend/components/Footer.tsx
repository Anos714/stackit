import { Heart, Package, Star } from "lucide-react";
import Link from "next/link";
import { Logo } from "./Logo";

const GITHUB = "https://github.com/Anos714/stackit";
const NPM_PKG = "https://www.npmjs.com/package/create-stackit-app";

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-white/10">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo compact />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-zinc-500">
              Opinionated full-stack scaffolder. MERN, PERN, Hono + Postgres, Go + Fiber — one
              command, best-practice repo.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <a
                href={GITHUB}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-zinc-400 transition-all hover:border-volt-400/40 hover:text-volt-300"
              >
                <Star className="h-3.5 w-3.5 transition-transform duration-300 group-hover:rotate-[20deg] group-hover:fill-volt-400 group-hover:text-volt-400" />
                Star on GitHub
              </a>
              <a
                href={NPM_PKG}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 font-mono text-xs text-zinc-400 transition-all hover:border-volt-400/40 hover:text-volt-300"
              >
                <Package className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5" />
                npm · create-stackit-app
              </a>
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
              ["npm package", NPM_PKG],
              ["GitHub", GITHUB],
            ]}
          />
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row sm:items-center">
          <p className="text-xs text-zinc-600">© 2026 stackit — scaffold fast, ship faster.</p>
          <p className="flex items-center gap-1.5 text-xs text-zinc-600">
            made with <Heart className="h-3.5 w-3.5 fill-volt-400 text-volt-400" /> by{" "}
            <span className="font-medium text-zinc-300 transition-colors hover:text-volt-300">
              Rahul Sain
            </span>
          </p>
        </div>
      </div>

      {/* oversized brand */}
      <div className="group relative select-none px-2" aria-hidden>
        <span className="mega-brand text-center font-display text-[22vw] font-bold leading-[0.85] tracking-[-0.04em] sm:text-[19vw] lg:text-[15rem]">
          stackit
          <span className="mega-lit" aria-hidden>
            stackit
          </span>
        </span>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#09090b] to-transparent" />
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  const external = (href: string) => href.startsWith("http");
  return (
    <div>
      <h4 className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500">
        {title}
      </h4>
      <ul className="mt-4 space-y-2.5">
        {links.map(([label, href]) =>
          external(href) ? (
            <li key={label}>
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-zinc-400 transition-colors hover:text-volt-300"
              >
                {label}
              </a>
            </li>
          ) : (
            <li key={label}>
              <Link href={href} className="text-sm text-zinc-400 transition-colors hover:text-volt-300">
                {label}
              </Link>
            </li>
          ),
        )}
      </ul>
    </div>
  );
}
