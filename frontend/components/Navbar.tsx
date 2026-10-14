"use client";

import { Menu, X, Zap } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

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
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? "border-b border-white/10 bg-[#09090b]/85 backdrop-blur-xl" : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-volt-400 text-black shadow-[0_0_24px_rgba(190,242,100,0.4)]">
            <Zap className="h-4.5 w-4.5" strokeWidth={2.5} fill="currentColor" />
          </span>
          <span className="text-lg font-semibold tracking-tight text-zinc-50">
            stackit
            <span className="ml-2 hidden rounded-full border border-white/10 bg-white/5 px-2 py-0.5 align-middle font-mono text-[10px] font-normal text-zinc-400 sm:inline">
              v0.1.0
            </span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className={`rounded-lg px-3.5 py-2 text-sm transition-colors ${
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
            className="rounded-lg bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-950 transition-all hover:bg-volt-400 hover:shadow-[0_0_24px_rgba(190,242,100,0.35)]"
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
      </nav>

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
    </header>
  );
}
