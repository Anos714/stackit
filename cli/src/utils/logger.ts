import pc from "picocolors";
import type { StackId } from "../types/index.ts";

export const log = {
  info: (msg: string) => console.log(`${pc.cyan("ℹ")} ${msg}`),
  ok: (msg: string) => console.log(`${pc.green("✔")} ${msg}`),
  warn: (msg: string) => console.log(`${pc.yellow("⚠")} ${msg}`),
  error: (msg: string) => console.error(`${pc.red("✖")} ${msg}`),
  dim: (msg: string) => console.log(pc.dim(msg)),
  title: (msg: string) => console.log(`\n${pc.bold(pc.cyan(msg))}`),
};

export function nextSteps(targetDir: string, pm: string, install: boolean, stack?: StackId): void {
  log.title("Next steps:");
  console.log(`  ${pc.dim("$")} ${pc.bold(`cd ${targetDir}`)}`);

  if (stack === "fastapi") {
    console.log(`  ${pc.dim("$")} ${pc.bold("docker compose up -d")}  ${pc.dim("# Postgres on :5432")}`);
    if (!install) {
      console.log(
        `  ${pc.dim("$")} ${pc.bold("uv venv server/.venv && uv pip install --python server/.venv -r server/requirements-dev.txt")}`,
      );
      console.log(
        `  ${pc.dim("# no uv?")} python -m venv server/.venv && server/.venv/bin/pip install -r server/requirements-dev.txt`,
      );
      console.log(`  ${pc.dim("$")} ${pc.bold(`cd client && ${pm} install && cd ..`)}`);
    }
    console.log(`  ${pc.dim("$")} ${pc.bold(`${pm} run dev`)}  ${pc.dim("# API :5000 + Next.js :3000")}`);
    return;
  }

  if (stack === "nestjs") {
    console.log(`  ${pc.dim("$")} ${pc.bold("cp .env.example server/.env")}`);
    console.log(`  ${pc.dim("$")} ${pc.bold("docker compose up -d")}  ${pc.dim("# Postgres on :5432")}`);
    if (!install) {
      const cmd = pm === "npm" ? "npm install" : `${pm} install`;
      console.log(`  ${pc.dim("$")} ${pc.bold(cmd)}  ${pc.dim("# root (concurrently)")}`);
      console.log(`  ${pc.dim("$")} ${pc.bold(`cd client && ${cmd} && cd ../server && ${cmd} && cd ..`)}`);
    }
    console.log(`  ${pc.dim("$")} ${pc.bold(`${pm} run dev`)}  ${pc.dim("# NestJS :5000 + Next.js :3000")}`);
    return;
  }

  if (!install) {
    const cmd = pm === "npm" ? "npm install" : `${pm} install`;
    console.log(`  ${pc.dim("$")} ${pc.bold(cmd)}`);
    console.log(`  ${pc.dim("$")} ${pc.bold(`${pm === "npm" ? "npm run" : pm} dev`)}  ${pc.dim("# runs client + server")}`);
  } else {
    console.log(`  ${pc.dim("$")} ${pc.bold(`${pm === "npm" ? "npm run" : pm} dev`)}  ${pc.dim("# runs client + server")}`);
  }
}
