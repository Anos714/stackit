import { Plus } from "lucide-react";
import { SPONSOR_MAILTO, SPONSORS } from "../lib/sponsors";
import { SponsorMark } from "./SponsorMark";

/** Compact sponsor strip for the navbar: real logos first, then an open slot. */
export function NavbarSponsors({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex items-center gap-1.5">
      {SPONSORS.map((sponsor) => (
        <a
          key={sponsor.name}
          href={sponsor.href}
          target="_blank"
          rel="noreferrer"
          onClick={onNavigate}
          title={`${sponsor.name} — ${sponsor.note}`}
          aria-label={`${sponsor.name} — sponsor of stackit`}
          className="group flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] border border-[#ffd23f]/35 bg-[#fff9ee] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#ffd23f] hover:shadow-[0_8px_18px_rgba(0,0,0,0.45)] focus-visible:ring-2 focus-visible:ring-volt-400/70 focus-visible:outline-none"
        >
          <SponsorMark
            name={sponsor.name}
            className="h-[18px] w-auto transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105"
          />
        </a>
      ))}
      <a
        href={SPONSOR_MAILTO}
        onClick={onNavigate}
        title="Sponsor stackit — $10 one-time"
        aria-label="Sponsor stackit — open a slot for $10 one-time"
        className="group flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] border border-dashed border-white/15 bg-white/[0.02] transition-all duration-300 hover:-translate-y-0.5 hover:border-volt-400/50 hover:bg-volt-400/[0.05] focus-visible:ring-2 focus-visible:ring-volt-400/70 focus-visible:outline-none"
      >
        <Plus className="h-3.5 w-3.5 text-zinc-600 transition-all duration-300 group-hover:rotate-90 group-hover:text-volt-300" />
      </a>
    </div>
  );
}
