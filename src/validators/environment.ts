import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { getStack } from "../config/stacks.ts";
import type { ProjectOptions } from "../types/index.ts";

const execFileAsync = promisify(execFile);

interface Version {
  major: number;
  minor: number;
  patch: number;
}

function parseVersion(raw: string): Version {
  const m = raw.match(/(\d+)\.(\d+)\.(\d+)/);
  if (!m) throw new Error(`Unable to determine version from: "${raw}"`);
  return { major: Number(m[1]), minor: Number(m[2]), patch: Number(m[3]) };
}

/** Correct semver tuple comparison: a >= b ? */
function isAtLeast(installed: Version, required: Version): boolean {
  if (installed.major !== required.major) return installed.major > required.major;
  if (installed.minor !== required.minor) return installed.minor > required.minor;
  return installed.patch >= required.patch;
}

function fmt(v: Version): string {
  return `${v.major}.${v.minor}.${v.patch}`;
}

async function commandExists(cmd: string): Promise<boolean> {
  try {
    await execFileAsync(process.platform === "win32" ? "where" : "which", [cmd]);
    return true;
  } catch {
    return false;
  }
}

async function rawVersion(cmd: string): Promise<string> {
  const args = cmd === "go" ? ["version"] : ["--version"];
  const { stdout, stderr } = await execFileAsync(cmd, args);
  return (stdout || stderr).trim();
}

async function requireTool(cmd: string, min: string, hint: string): Promise<void> {
  if (!(await commandExists(cmd))) {
    throw new Error(`"${cmd}" is not installed. ${hint}`);
  }
  const installed = parseVersion(await rawVersion(cmd));
  const required = parseVersion(min);
  if (!isAtLeast(installed, required)) {
    throw new Error(`"${cmd}" ${fmt(installed)} is too old (need >= ${min}). ${hint}`);
  }
}

async function warnTool(cmd: string, min: string): Promise<string | null> {
  if (!(await commandExists(cmd))) return `"${cmd}" not found — install it before running install/dev.`;
  try {
    const installed = parseVersion(await rawVersion(cmd));
    if (!isAtLeast(installed, parseVersion(min))) {
      return `"${cmd}" ${fmt(installed)} is older than recommended >= ${min}.`;
    }
  } catch {
    return `Could not determine "${cmd}" version.`;
  }
  return null;
}

/**
 * Validate the host environment for the chosen stack.
 * Throws on fatal problems (missing runtime), returns warnings otherwise.
 */
export async function validateEnvironment(options: ProjectOptions): Promise<string[]> {
  const warnings: string[] = [];
  const stack = getStack(options.stack);

  // 1. Runtime is fatal — scaffolding targets it directly.
  const runtimeTool = options.runtime; // "node" | "bun" | "go"
  const req = stack.requirements.find((r) => r.tool === runtimeTool);
  await requireTool(runtimeTool, req?.minVersion ?? "0.0.0", req?.hint ?? "");

  // 2. Package manager — warning only (user can pass --no-install).
  if (options.install && stack.packageManagers.length > 0) {
    const pm = options.packageManager;
    if (pm !== runtimeTool) {
      const w = await warnTool(pm, "0.0.0");
      if (w) warnings.push(w);
    }
  }

  // 3. go-fiber frontend still needs node for Vite.
  if (options.stack === "go-fiber") {
    const w = await warnTool("node", "20.0.0");
    if (w) warnings.push(`Frontend needs Node LTS: ${w}`);
  }

  // 4. git — warning only.
  if (options.git) {
    const w = await warnTool("git", "0.0.0");
    if (w) warnings.push(`git: ${w} (use --no-git to skip)`);
  }

  return warnings;
}

export const __test__ = { parseVersion, isAtLeast };
