"use client";

import { Menu, Star, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { GithubMark } from "./GithubMark";
import { Logo } from "./Logo";

const LINKS = [
  { href: "/#stacks", label: "Stacks" },
  { href: "/#features", label: "Features" },
  { href: "/#workflow", label: "Workflow" },
  { href: "/#faq", label: "FAQ" },
  { href: "/docs", label: "Docs" },
];

const nf = new Intl.NumberFormat("en-US");

type NavbarProps = {
  weeklyDownloads?: number | null;
  stars?: number | null;
};

export function Navbar({ weeklyDownloads = null, stars = null }: NavbarProps) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <nav
        className={`transition-all duration-300 ${
          scrolled ? "border-b border-white/10 bg-[#09090b]/85 backdrop-blur-xl" : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5" aria-label="stackit home">
            <Logo />
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {LINKS.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                data-active={pathname === l.href}
                className={`nav-link rounded-lg px-3.5 py-2 text-sm transition-colors ${
                  pathname === l.href
                    ? "text-volt-300"
                    : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>

          <div className="hidden items-center gap-2.5 md:flex">
            {weeklyDownloads !== null && (
              <a
                href="https://www.npmjs.com/package/create-stackit-app"
                target="_blank"
                rel="noreferrer"
                aria-label={`${nf.format(weeklyDownloads)} npm downloads this week`}
                className="hidden h-9 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] pl-3 pr-3.5 transition-colors hover:border-white/20 hover:bg-white/[0.06] lg:inline-flex"
              >
                <span aria-hidden className="size-2 shrink-0 rounded-full bg-emerald-400" />
                <span className="font-mono text-[12px] font-semibold tabular-nums text-zinc-100">
                  {nf.format(weeklyDownloads)}
                </span>
                <span className="whitespace-nowrap text-[12px] text-zinc-500">downloads / week</span>
              </a>
            )}
            <a
              href="https://github.com/Anos714/stackit"
              target="_blank"
              rel="noreferrer"
              aria-label={
                stars !== null
                  ? `Star stackit on GitHub — ${nf.format(stars)} stars`
                  : "Star stackit on GitHub"
              }
              className="group flex h-9 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-2.5 text-[13px] text-zinc-200 transition-all hover:border-volt-400/40 hover:bg-white/[0.09] hover:text-volt-300 lg:justify-start lg:pl-3 lg:pr-2"
            >
              <GithubMark className="h-4 w-4" />
              <span className="hidden font-medium lg:inline">Star</span>
              <Star className="hidden h-3.5 w-3.5 fill-amber-300 text-amber-300 transition-transform duration-300 group-hover:rotate-[20deg] lg:block" />
              {stars !== null && (
                <span className="inline-flex rounded-full bg-white/10 px-2 py-0.5 font-mono text-[11px] tabular-nums text-zinc-300">
                  {nf.format(stars)}
                </span>
              )}
            </a>
            <Link
              href="/docs"
              className="btn-shine whitespace-nowrap rounded-lg bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-950 transition-all hover:bg-volt-400 hover:shadow-[0_0_24px_rgba(190,242,100,0.35)]"
            >
              Get started
            </Link>
          </div>

          <button
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-300 hover:bg-white/5 md:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {open && (
          <div className="border-t border-white/10 bg-[#09090b]/95 px-5 pb-6 pt-2 backdrop-blur-xl md:hidden">
            {LINKS.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-3 text-[15px] text-zinc-300 hover:bg-white/5 hover:text-zinc-50"
              >
                {l.label}
              </Link>
            ))}
            {weeklyDownloads !== null && (
              <a
                href="https://www.npmjs.com/package/create-stackit-app"
                target="_blank"
                rel="noreferrer"
                onClick={() => setOpen(false)}
                aria-label={`${nf.format(weeklyDownloads)} npm downloads this week`}
                className="mt-2 flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2.5 text-[13px]"
              >
                <span aria-hidden className="size-2 shrink-0 rounded-full bg-emerald-400" />
                <span className="font-mono font-semibold tabular-nums text-zinc-100">
                  {nf.format(weeklyDownloads)}
                </span>
                <span className="text-zinc-500">downloads this week</span>
              </a>
            )}
            <Link
              href="/docs"
              onClick={() => setOpen(false)}
              className="mt-2 block rounded-lg bg-zinc-50 px-3 py-3 text-center text-[15px] font-medium text-zinc-950"
            >
              Get started
            </Link>
            <a
              href="https://github.com/Anos714/stackit"
              target="_blank"
              rel="noreferrer"
              onClick={() => setOpen(false)}
              aria-label={
                stars !== null
                  ? `Star stackit on GitHub — ${nf.format(stars)} stars`
                  : "Star stackit on GitHub"
              }
              className="mt-2 flex items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-3 text-center text-[15px] text-zinc-300"
            >
              <GithubMark className="h-4 w-4" />
              Star on GitHub
              <Star className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />
              {stars !== null && (
                <span className="rounded-full bg-white/10 px-2 py-0.5 font-mono text-[11px] tabular-nums text-zinc-300">
                  {nf.format(stars)}
                </span>
              )}
            </a>
          </div>
        )}
      </nav>
    </header>
  );
}
