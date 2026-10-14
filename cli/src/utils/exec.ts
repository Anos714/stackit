import { spawn } from "node:child_process";

export interface RunResult {
  code: number;
}

/** Run a command, streaming stdio to the terminal. Resolves with exit code. */
export function run(
  cmd: string,
  args: string[],
  cwd: string,
  extraEnv?: Record<string, string>,
): Promise<RunResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd,
      stdio: "inherit",
      shell: process.platform === "win32",
      env: { ...process.env, ...extraEnv },
    });
    child.on("error", reject);
    child.on("close", (code) => resolve({ code: code ?? 1 }));
  });
}

export function installArgs(pm: string): string[] {
  switch (pm) {
    case "npm":
      return ["install", "--no-audit", "--no-fund"];
    case "yarn":
      return ["install"];
    case "pnpm":
      return ["install"];
    case "bun":
      return ["install"];
    default:
      return ["install"];
  }
}
