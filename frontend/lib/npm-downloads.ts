import { cacheLife } from "next/cache";

const PKG = "create-stackit-app";
const NPM_API = "https://api.npmjs.org/downloads";
/** First publish date — used to sum every download since launch. */
const PUBLISHED = "2026-10-14";

export type NpmDownloads = {
  weekly: number | null;
  total: number | null;
};

async function getJson(url: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error(`${url} responded ${res.status}`);
  return res.json();
}

/**
 * Live npm numbers, refreshed hourly. Returns nulls instead of stale or
 * invented values when the registry can't be reached.
 */
export async function getNpmDownloads(): Promise<NpmDownloads> {
  "use cache";
  cacheLife("hours");

  const today = new Date().toISOString().slice(0, 10);
  const [weekRes, rangeRes] = await Promise.allSettled([
    getJson(`${NPM_API}/point/last-week/${PKG}`),
    getJson(`${NPM_API}/range/${PUBLISHED}:${today}/${PKG}`),
  ]);

  let weekly: number | null = null;
  if (weekRes.status === "fulfilled") {
    const value = (weekRes.value as { downloads?: unknown }).downloads;
    if (typeof value === "number") weekly = value;
  }

  let total: number | null = null;
  if (rangeRes.status === "fulfilled") {
    const days = (rangeRes.value as { downloads?: { downloads?: unknown }[] }).downloads;
    if (Array.isArray(days)) {
      const sum = days.reduce(
        (acc, day) => acc + (typeof day.downloads === "number" ? day.downloads : 0),
        0,
      );
      if (sum > 0) total = sum;
    }
  }

  return { weekly, total };
}
