import { ArrowUpRight } from "lucide-react";
import { getNpmDownloads } from "@/lib/npm-downloads";

const nf = new Intl.NumberFormat("en-US");

function Metric({ value, label }: { value: number; label: string }) {
  return (
    <span className="inline-flex items-baseline gap-1.5 whitespace-nowrap">
      <span className="font-mono text-[13px] font-medium tabular-nums text-zinc-200 sm:text-sm">
        {nf.format(value)}
      </span>
      <span>{label}</span>
    </span>
  );
}

export async function DownloadStats() {
  const { weekly, total } = await getNpmDownloads();
  if (weekly === null && total === null) return null;

  const label = [
    weekly !== null ? `${nf.format(weekly)} downloads this week` : null,
    total !== null ? `${nf.format(total)} total downloads` : null,
    "on npm",
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <a
      href="https://www.npmjs.com/package/create-stackit-app"
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className="group inline-flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 font-mono text-[11px] text-zinc-500 transition-colors hover:text-zinc-400 sm:text-xs"
    >
      {weekly !== null && <Metric value={weekly} label="downloads this week" />}
      <span className="inline-flex items-center gap-x-2.5 whitespace-nowrap">
        {weekly !== null && total !== null && (
          <span aria-hidden className="text-zinc-700 max-[359px]:hidden">
            ·
          </span>
        )}
        {total !== null && <Metric value={total} label="total" />}
        <span className="inline-flex items-center gap-1 transition-colors group-hover:text-volt-300">
          on npm
          <ArrowUpRight className="h-3 w-3 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </span>
      </span>
    </a>
  );
}
