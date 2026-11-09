"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

const COMMAND = "bunx create-stackit-app@latest create my-app -y";

/** Hero command bar with an always-visible copy button (touch friendly). */
export function HeroCommand() {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(COMMAND);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = COMMAND;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="mx-auto mt-7 flex w-full max-w-xl items-center gap-2 rounded-xl border border-white/10 bg-black/50 p-1.5 pl-4 backdrop-blur transition-colors focus-within:border-volt-400/40 hover:border-volt-400/30">
      <span aria-hidden className="shrink-0 font-mono text-xs text-volt-400">
        $
      </span>
      <code className="min-w-0 flex-1 whitespace-pre-wrap break-words py-1 font-mono text-[12px] text-zinc-300 sm:whitespace-nowrap sm:text-[13px]">
        {COMMAND}
      </code>
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? "Command copied" : "Copy scaffold command"}
        className="flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-[11px] text-zinc-400 transition-all hover:border-volt-400/40 hover:text-volt-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt-400/60 active:scale-[0.97]"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-volt-400" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
        <span>{copied ? "Copied" : "Copy"}</span>
      </button>
    </div>
  );
}
