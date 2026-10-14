/**
 * stackit mark — three stacked layers (frontend · api · database)
 * on a volt tile, with a blinking terminal cursor on the wordmark.
 */
export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" role="img" aria-label="stackit logo">
      <defs>
        <linearGradient id="stackit-volt" x1="0" y1="0" x2="32" y2="32">
          <stop offset="0" stopColor="#e9ffb8" />
          <stop offset="0.55" stopColor="#bef264" />
          <stop offset="1" stopColor="#84cc16" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="30" height="30" rx="8" fill="url(#stackit-volt)" />
      <rect
        x="1"
        y="1"
        width="30"
        height="30"
        rx="8"
        fill="none"
        stroke="#09090b"
        strokeOpacity="0.18"
      />
      <g fill="#0b0b0d">
        <path d="M16 7 24.5 11 16 15 7.5 11Z" />
        <path d="M7.5 13.6 16 17.6 24.5 13.6 24.5 15.7 16 19.7 7.5 15.7Z" />
        <path d="M7.5 18.3 16 22.3 24.5 18.3 24.5 20.4 16 24.4 7.5 20.4Z" />
      </g>
    </svg>
  );
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="transition-transform duration-300 hover:rotate-[-6deg]">
        <LogoMark size={compact ? 28 : 32} />
      </span>
      <span className="font-display text-lg font-semibold tracking-tight text-zinc-50">
        stackit
        <span className="ml-1 inline-block h-[1.05em] w-[0.5em] translate-y-[0.18em] animate-blink bg-volt-400" aria-hidden />
      </span>
    </span>
  );
}
