/** Brand marks for sponsor tiles. Keep the artwork with the sponsor data. */
export function SponsorMark({ name, className }: { name: string; className?: string }) {
  if (name === "Kilosmith") {
    return (
      <svg viewBox="10 14 44 40" aria-hidden className={className}>
        <rect x="12" y="16" width="40" height="10" rx="5" fill="#ffd23f" />
        <rect x="12" y="29" width="28" height="10" rx="5" fill="#a9c7ff" />
        <rect x="12" y="42" width="15" height="10" rx="5" fill="#ff5ca8" />
      </svg>
    );
  }

  return null;
}
