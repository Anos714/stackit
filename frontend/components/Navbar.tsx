"use client";

import { Menu, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { APP_VERSION } from "../lib/content";

const LINKS = [
  { href: "/#stacks", label: "Stacks" },
  { href: "/#features", label: "Features" },
  { href: "/#workflow", label: "Workflow" },
  { href: "/#faq", label: "FAQ" },
  { href: "/docs", label: "Docs" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [promo, setPromo] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      {promo && (
        <div className="btn-shine flex h-9 items-center justify-center gap-2 bg-volt-400 px-10 text-zinc-950">
          <Sparkles className="h-3.5 w-3.5 shrink-0" />
          <p className="truncate font-mono text-[11px] font-semibold uppercase tracking-[0.14em] sm:text-xs">
            Coming soon — NestJS · Django · FastAPI · Gin stacks
          </p>
          <button
            onClick={() => setPromo(false)}
            aria-label="Dismiss announcement"
            className="absolute right-3 flex h-6 w-6 items-center justify-center rounded-md transition-colors hover:bg-black/10"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <nav
        className={`transition-all duration-300 ${
          scrolled ? "border-b border-white/10 bg-[#09090b]/85 backdrop-blur-xl" : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5" aria-label="stackit home">
            <Logo />
            <span className="ml-1 hidden rounded-full border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[10px] text-zinc-400 sm:inline">
              v{APP_VERSION}
            </span>
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

          <div className="hidden md:block">
            <Link
              href="/docs"
              className="btn-shine rounded-lg bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-950 transition-all hover:bg-volt-400 hover:shadow-[0_0_24px_rgba(190,242,100,0.35)]"
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
            <Link
              href="/docs"
              onClick={() => setOpen(false)}
              className="mt-3 block rounded-lg bg-zinc-50 px-3 py-3 text-center text-[15px] font-medium text-zinc-950"
            >
              Get started
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}
