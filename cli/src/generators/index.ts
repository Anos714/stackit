import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { getStack } from "../config/stacks.ts";
import type { ProjectOptions } from "../types/index.ts";
import { installArgs, canRun, run, toolBinary } from "../utils/exec.ts";
import { writeFiles, type FileMap } from "../utils/fs.ts";
import {
  ROOT_GITIGNORE,
  clientFiles,
  goReadme,
  goRootPackageJson,
  makefile,
  readme,
  rootPackageJson,
} from "./common.ts";
import { expressFiles } from "./express.ts";
import {
  FASTAPI_GITIGNORE_EXTRA,
  fastapiFiles,
  fastapiReadme,
  fastapiRootPackageJson,
  nextClientFiles,
} from "./fastapi.ts";
import { goFiberFiles } from "./gofiber.ts";
import { honoFiles } from "./hono.ts";
import { NESTJS_GITIGNORE_EXTRA, nestjsFiles, nestjsReadme, nestjsRootPackageJson } from "./nestjs.ts";

export interface GenerateResult {
  targetDir: string;
  fileCount: number;
  installed: boolean;
  gitInit: boolean;
}

/** Assemble every file for the chosen stack (root + client + server). */
export function buildFileMap(o: ProjectOptions): FileMap {
  const stack = getStack(o.stack);

  if (o.stack === "go-fiber") {
    const server = goFiberFiles(o);
    return {
      [`package.json`]: goRootPackageJson(o),
      [`.gitignore`]: ROOT_GITIGNORE,
      [`README.md`]: goReadme(o),
      [`Makefile`]: makefile(),
      [`.env.example`]: server[`server/.env.example`] as string,
      ...clientFiles({ ...o, language: "typescript", runtime: "node" } as ProjectOptions),
      ...server,
    };
  }

  if (o.stack === "fastapi") {
    const server = fastapiFiles(o);
    return {
      [`package.json`]: fastapiRootPackageJson(o),
      [`.gitignore`]: ROOT_GITIGNORE + "\n" + FASTAPI_GITIGNORE_EXTRA,
      [`README.md`]: fastapiReadme(o),
      [`.env.example`]: server[`server/.env.example`] as string,
      ...nextClientFiles(o),
      ...server,
    };
  }

  if (o.stack === "nestjs") {
    const server = nestjsFiles(o);
    return {
      [`package.json`]: nestjsRootPackageJson(o),
      [`.gitignore`]: ROOT_GITIGNORE + "\n" + NESTJS_GITIGNORE_EXTRA,
      [`README.md`]: nestjsReadme(o),
      [`.env.example`]: server[`server/.env.example`] as string,
      ...nextClientFiles(o),
      ...server,
    };
  }

  const backendLabel = stack.backend === "express" ? "Express" : "Hono";
  const dbLabel = stack.database === "mongodb" ? "MongoDB" : "PostgreSQL";
  const backendFiles = stack.backend === "express"
    ? expressFiles(o, stack.database === "mongodb" ? "mongodb" : "postgres")
    : honoFiles(o);

  return {
    [`package.json`]: rootPackageJson(o),
    [`.gitignore`]: ROOT_GITIGNORE,
    [`README.md`]: readme(o, backendLabel, dbLabel),
    [`.env.example`]: backendFiles[`server/.env.example`] as string,
    ...clientFiles(o),
    ...backendFiles,
  };
}

async function initGit(dir: string): Promise<boolean> {
  try {
    const { code } = await run("git", ["init", "-q"], dir);
    return code === 0;
  } catch {
    return false;
  }
}

async function installDeps(o: ProjectOptions, dir: string): Promise<void> {
  if (o.stack === "go-fiber") {
    // Go backend + npm frontend.
    const tidy = await run("go", ["mod", "tidy"], `${dir}/server`);
    if (tidy.code !== 0) throw new Error("go mod tidy failed in server/");
    const npmInstall = await run("npm", ["install", "--no-audit", "--no-fund"], `${dir}/client`);
    if (npmInstall.code !== 0) throw new Error("npm install failed in client/");
    return;
  }

  if (o.stack === "fastapi") {
    const pm = o.packageManager;
    // Root first (concurrently), then the venv, then the Next.js client.
    const rootInstall = await run(pm, installArgs(pm), dir);
    if (rootInstall.code !== 0) throw new Error(`${pm} install failed in root/`);
    await installPythonDeps(dir);
    const clientInstall = await run(pm, installArgs(pm), `${dir}/client`);
    if (clientInstall.code !== 0) throw new Error(`${pm} install failed in client/`);
    return;
  }

  // Node stacks (including nestjs): root, then the Next.js client, then the server.


  const pm = o.packageManager;
  for (const sub of ["", "client", "server"]) {
    const cwd = sub ? `${dir}/${sub}` : dir;
    const { code } = await run(pm, installArgs(pm), cwd);
    if (code !== 0) throw new Error(`${pm} install failed in ${sub || "root"}/`);
  }
}

/**
 * Create server/.venv and install runtime + dev deps into it.
 *
 * uv is used when it is on PATH because it resolves and installs far faster;
 * otherwise we fall back to stdlib venv + pip, which works everywhere.
 */
async function installPythonDeps(dir: string): Promise<void> {
  const serverDir = `${dir}/server`;
  const python = toolBinary("python");
  const venvPython =
    process.platform === "win32"
      ? `${serverDir}/.venv/Scripts/python.exe`
      : `${serverDir}/.venv/bin/python`;

  if (await canRun("uv")) {
    const venv = await run("uv", ["venv", ".venv", "--python", python], serverDir);
    if (venv.code !== 0) throw new Error("uv venv failed in server/");

    const install = await run(
      "uv",
      ["pip", "install", "--python", venvPython, "-r", "requirements-dev.txt"],
      serverDir,
    );
    if (install.code !== 0) throw new Error("uv pip install failed in server/");
    return;
  }

  const venv = await run(python, ["-m", "venv", ".venv"], serverDir);
  if (venv.code !== 0) {
    throw new Error(`"${python} -m venv" failed — install the venv module (e.g. apt install python3-venv)`);
  }

  const upgrade = await run(venvPython, ["-m", "pip", "install", "--upgrade", "pip", "--quiet"], serverDir);
  if (upgrade.code !== 0) throw new Error("pip upgrade failed in server/");

  const install = await run(
    venvPython,
    ["-m", "pip", "install", "-r", "requirements-dev.txt"],
    serverDir,
  );
  if (install.code !== 0) throw new Error("pip install failed in server/");
}

/** Write the scaffold, then optionally git-init and install dependencies. */
export async function generateProject(o: ProjectOptions): Promise<GenerateResult> {
  if (!existsSync(o.targetDir)) await mkdir(o.targetDir, { recursive: true });

  const files = buildFileMap(o);
  const fileCount = await writeFiles(o.targetDir, files);

  let gitInit = false;
  if (o.git) gitInit = await initGit(o.targetDir);

  let installed = false;
  if (o.install) {
    await installDeps(o, o.targetDir);
    installed = true;
  }

  return { targetDir: o.targetDir, fileCount, installed, gitInit };
}
