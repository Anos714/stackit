import type { Language, PackageManager, Runtime, StackDef, StackId } from "../types/index.ts";

const JS_TS: readonly Language[] = ["typescript", "javascript"] as const;
const NODE_BUN: readonly Runtime[] = ["node", "bun"] as const;
const ALL_PM: readonly PackageManager[] = ["npm", "pnpm", "yarn", "bun"] as const;

export const STACKS: Record<StackId, StackDef> = {
  mern: {
    id: "mern",
    label: "MERN",
    description: "MongoDB + Express + React (Vite) + Node/Bun",
    frontend: "vite-react",
    backend: "express",
    database: "mongodb",
    languages: JS_TS,
    runtimes: NODE_BUN,
    packageManagers: ALL_PM,
    defaultRuntime: "bun",
    requirements: [
      { tool: "node", minVersion: "20.0.0", hint: "https://nodejs.org — LTS >= 20" },
      { tool: "bun", minVersion: "1.2.0", hint: "https://bun.sh — only if runtime/bun or pm=bun" },
    ],
  },
  pern: {
    id: "pern",
    label: "PERN",
    description: "PostgreSQL + Express + React (Vite) + Node/Bun",
    frontend: "vite-react",
    backend: "express",
    database: "postgres",
    languages: JS_TS,
    runtimes: NODE_BUN,
    packageManagers: ALL_PM,
    defaultRuntime: "bun",
    requirements: [
      { tool: "node", minVersion: "20.0.0", hint: "https://nodejs.org — LTS >= 20" },
      { tool: "bun", minVersion: "1.2.0", hint: "https://bun.sh — only if runtime/bun or pm=bun" },
    ],
  },
  "hono-pg": {
    id: "hono-pg",
    label: "React + Hono + Postgres",
    description: "React (Vite) + Hono API + PostgreSQL — edge-ready",
    frontend: "vite-react",
    backend: "hono",
    database: "postgres",
    languages: JS_TS,
    runtimes: NODE_BUN,
    packageManagers: ALL_PM,
    defaultRuntime: "bun",
    requirements: [
      { tool: "node", minVersion: "20.0.0", hint: "https://nodejs.org — LTS >= 20" },
      { tool: "bun", minVersion: "1.2.0", hint: "https://bun.sh — recommended for Hono" },
    ],
  },
  "go-fiber": {
    id: "go-fiber",
    label: "Go + Fiber",
    description: "React (Vite) + Go Fiber API + PostgreSQL-ready",
    frontend: "vite-react",
    backend: "fiber",
    database: "postgres",
    languages: ["go"] as const,
    runtimes: ["go"] as const,
    packageManagers: [],
    defaultRuntime: "go",
    requirements: [
      { tool: "go", minVersion: "1.24.0", hint: "https://go.dev/dl — >= 1.24" },
      { tool: "node", minVersion: "20.0.0", hint: "https://nodejs.org — needed for Vite frontend" },
    ],
  },
} as const;

export const STACK_IDS = Object.keys(STACKS) as StackId[];

export function getStack(id: StackId): StackDef {
  return STACKS[id];
}

export function isSupportedCombo(stack: StackId, language: Language, runtime: Runtime): boolean {
  const def = STACKS[stack];
  return def.languages.includes(language) && def.runtimes.includes(runtime);
}
