"use client";

import { RotateCcw } from "lucide-react";
import type { CSSProperties } from "react";
import { useEffect, useState } from "react";

const MAX_PATH = 34;

export function LostRoute() {
  const [path, setPath] = useState("");
  const [typed, setTyped] = useState("");
  const [done, setDone] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const raw = window.location.pathname + window.location.search;
    const next = raw.length > MAX_PATH ? `${raw.slice(0, MAX_PATH - 1)}…` : raw;
    const frame = window.requestAnimationFrame(() => setPath(next || "/"));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!path) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      const frame = window.requestAnimationFrame(() => {
        setTyped(path);
        setDone(true);
      });
      return () => window.cancelAnimationFrame(frame);
    }

    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setTyped(path.slice(0, i));
      if (i >= path.length) {
        window.clearInterval(id);
        setDone(true);
      }
    }, 52);

    return () => window.clearInterval(id);
  }, [path, attempt]);

  function replay() {
    setTyped("");
    setDone(false);
    setAttempt((a) => a + 1);
  }

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/50 text-left shadow-[0_24px_60px_rgba(0,0,0,0.55)] backdrop-blur transition-colors duration-500 hover:border-volt-400/25"
      aria-label="Terminal showing the requested route and the 404 error"
      role="group"
    >
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
        <span className="flex gap-1.5" aria-hidden>
          <i className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <i className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <i className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        </span>
        <span className="ml-1 truncate font-mono text-xs text-zinc-500">
          <span className="hidden sm:inline">stackit — </span>resolve route
        </span>
        <button
          onClick={replay}
          aria-label="Replay the error animation"
          className="ml-auto flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-600 transition-colors hover:bg-white/5 hover:text-volt-300"
        >
          <RotateCcw className="h-3 w-3" />
          replay
        </button>
      </div>

      <div className="px-4 py-4 font-mono text-[12.5px] leading-relaxed sm:px-5 sm:text-[13px]">
        <p className="flex flex-wrap items-baseline gap-x-2 text-zinc-300">
          <span className="text-volt-400">$</span>
          <span className="text-zinc-500">stackit open</span>
          <span aria-hidden className="break-all text-zinc-100">
            {typed}
            <span className="animate-blink text-volt-400">▊</span>
          </span>
        </p>

        <div
          className={`mt-3 space-y-1 ${done ? "rise" : "invisible"}`}
          style={{ "--rise-delay": "80ms" } as CSSProperties}
          aria-hidden
        >
          <p>
            <span className="text-rose-400/80">✖</span>{" "}
            <span className="text-zinc-500">error 404</span>{" "}
            <span className="text-zinc-700">·</span>{" "}
            <span className="text-zinc-300">no route matches this path</span>
          </p>
          <p className="text-zinc-600">
            <span className="text-volt-400/80">→</span> hint: check the URL, or start again from{" "}
            <span className="text-volt-300">/docs</span>
          </p>
        </div>

        <p className="sr-only">
          Requested path {path || "unknown"} was not found. Error 404, no route matches this path.
        </p>
      </div>
    </div>
  );
}
