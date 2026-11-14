import { cacheLife } from "next/cache";

const REPO_API = "https://api.github.com/repos/Anos714/stackit";

/**
 * Live star count, refreshed hourly. Returns null instead of a stale or
 * invented number when the GitHub API can't be reached.
 */
export async function getGithubStars(): Promise<number | null> {
  "use cache";
  cacheLife("hours");

  try {
    const res = await fetch(REPO_API, {
      headers: {
        accept: "application/vnd.github+json",
        "user-agent": "stackit-site",
      },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;

    const data = (await res.json()) as { stargazers_count?: unknown };
    return typeof data.stargazers_count === "number" ? data.stargazers_count : null;
  } catch {
    return null;
  }
}
