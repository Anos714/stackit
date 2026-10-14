"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function CodeBlock({
  code,
  lang = "bash",
  title,
  compact = false,
}: {
  code: string;
  lang?: string;
  title?: string;
  compact?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="group relative overflow-hidden rounded-xl border border-white/10 bg-black/60">
      {title && (
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
          <span className="flex gap-1.5" aria-hidden>
            <i className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
            <i className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
            <i className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          </span>
          <span className="ml-1 font-mono text-xs text-zinc-500">{title}</span>
          <span className="ml-auto hidden font-mono text-[10px] uppercase tracking-widest text-zinc-600 sm:block">
            {lang}
          </span>
        </div>
      )}
      <pre
        className={`overflow-x-auto font-mono text-[13px] leading-relaxed text-zinc-200 ${
          compact ? "px-4 py-3" : "px-4 py-4 sm:px-5"
        }`}
      >
        <code>{code}</code>
      </pre>
      <button
        onClick={copy}
        aria-label="Copy to clipboard"
        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-400 opacity-0 backdrop-blur transition-all hover:border-volt-400/40 hover:text-volt-300 focus:opacity-100 focus:outline-none group-hover:opacity-100"
      >
        {copied ? <Check className="h-4 w-4 text-volt-400" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  );
}
