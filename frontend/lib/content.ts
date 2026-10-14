/** Single source of truth — keep in sync with cli/package.json version. */
export const APP_VERSION = "0.1.1";

export interface Stack {
  id: string;
  label: string;
  tagline: string;
  backend: string;
  database: string;
  runtime: string;
  command: string;
  files: { path: string; note: string }[];
  highlight: string[];
}

export const STACKS: Stack[] = [
  {
    id: "mern",
    label: "MERN",
    tagline: "MongoDB + Express + React — the classic, minus the boilerplate pain.",
    backend: "Express + Mongoose",
    database: "MongoDB",
    runtime: "Bun / Node",
    command: "bunx create-stackit-app@latest create my-app --stack mern --language typescript --runtime bun --pm bun -y",
    files: [
      { path: "client/src/App.tsx", note: "demo page wired to the API" },
      { path: "server/src/app.ts", note: "app factory + middleware" },
      { path: "server/src/models/user.ts", note: "mongoose schema" },
      { path: "server/src/routes/users.ts", note: "CRUD routes + zod" },
      { path: "docker-compose.yml", note: "one-command Mongo" },
    ],
    highlight: ["most popular", "TS-first"],
  },
  {
    id: "pern",
    label: "PERN",
    tagline: "PostgreSQL + Express + React — relational data done right.",
    backend: "Express + pg",
    database: "PostgreSQL",
    runtime: "Bun / Node",
    command: "bunx create-stackit-app@latest create shop-api --stack pern --language typescript --runtime node --pm pnpm -y",
    files: [
      { path: "client/src/App.tsx", note: "demo page wired to the API" },
      { path: "server/src/app.ts", note: "app factory + middleware" },
      { path: "server/src/config/db.ts", note: "pg pool + health check" },
      { path: "server/src/models/user.ts", note: "SQL DDL in code" },
      { path: "docker-compose.yml", note: "one-command Postgres" },
    ],
    highlight: ["SQL", "production-ready"],
  },
  {
    id: "hono-pg",
    label: "Hono + PG",
    tagline: "Edge-ready Hono API + Postgres — tiny, fast, modern.",
    backend: "Hono + zod-validator",
    database: "PostgreSQL",
    runtime: "Bun-native / Node",
    command: "bunx create-stackit-app@latest create edge-api --stack hono-pg --language typescript --runtime bun --pm bun -y",
    files: [
      { path: "client/src/App.tsx", note: "demo page wired to the API" },
      { path: "server/src/app.ts", note: "hono app + cors + logger" },
      { path: "server/src/index.ts", note: "Bun.serve / node-server" },
      { path: "server/src/routes/users.ts", note: "typed validators" },
      { path: "docker-compose.yml", note: "one-command Postgres" },
    ],
    highlight: ["edge-ready", "fastest cold start"],
  },
  {
    id: "go-fiber",
    label: "Go + Fiber",
    tagline: "Go Fiber API + React — raw speed with a Postgres upgrade path.",
    backend: "Fiber + pgx (optional)",
    database: "Postgres-ready",
    runtime: "Go 1.24+",
    command: "bunx create-stackit-app@latest create fast-api --stack go-fiber -y",
    files: [
      { path: "client/src/App.tsx", note: "demo page wired to the API" },
      { path: "server/cmd/api/main.go", note: "entrypoint" },
      { path: "server/internal/handlers/", note: "health + users" },
      { path: "server/internal/db/db.go", note: "optional pgx pool" },
      { path: "Makefile", note: "tidy / dev / build" },
    ],
    highlight: ["blazing fast", "single binary"],
  },
];

export interface Feature {
  icon: string;
  title: string;
  body: string;
}

export const FEATURES: Feature[] = [
  {
    icon: "layers",
    title: "Best-practice layouts",
    body: "Layered backends — routes, controllers, models, middlewares, config, utils. No dumping everything in index.js, ever.",
  },
  {
    icon: "zap",
    title: "Bun-first, Node-friendly",
    body: "Bun gets --hot reload and native TS. Node gets tsx watch + tsc builds. The template adapts scripts per runtime automatically.",
  },
  {
    icon: "shield",
    title: "Validation baked in",
    body: "Every write endpoint ships with zod validation, a central error handler, 404s and an async wrapper. 400s, not 500s.",
  },
  {
    icon: "database",
    title: "Databases with one command",
    body: "docker-compose.yml for Mongo or Postgres in every scaffold. Copy .env.example, compose up, done.",
  },
  {
    icon: "terminal",
    title: "Flags-first CLI",
    body: "Fully non-interactive with -y and --stack/--language/--runtime/--pm. Perfect for scripts, CI and dotfiles.",
  },
  {
    icon: "package",
    title: "Monorepo that just runs",
    body: "client/ + server/ with concurrently wired dev. One command boots the full stack, Vite proxy already pointing at the API.",
  },
];

export interface Faq {
  q: string;
  a: string;
}

export const FAQS: Faq[] = [
  {
    q: "How is this different from create-next-app or degit templates?",
    a: "Those give you one frontend. stackit scaffolds the whole full-stack repo — Vite + React client, a layered API backend, database wiring, Docker and env files — across 4 backend stacks, 2 languages and 2 runtimes, from one CLI.",
  },
  {
    q: "Do I need Bun installed?",
    a: "No — bunx/npx runs the published binary with plain Node. You only need Bun if you run the CLI from source. Generated projects run on whatever you pick — Node 20+, Bun 1.2+, or Go 1.24+. The CLI even checks your machine first and tells you exactly what's missing.",
  },
  {
    q: "JavaScript or TypeScript?",
    a: "Your call, per scaffold. TypeScript gets strict tsconfigs, typed API helpers and tsc builds; JavaScript stays lean with zero build step. Go stacks always use Go for the backend with a TypeScript frontend.",
  },
  {
    q: "Does it install dependencies for me?",
    a: "Yes by default — root, client and server (or go mod tidy + npm for Go stacks), plus git init. Pass --no-install / --no-git to skip either. Offline? Scaffold first, install later.",
  },
  {
    q: "Can I use it in scripts and CI?",
    a: "That's what -y is for. Every prompt has a flag: --stack, --language, --runtime, --pm. Invalid combos are rejected with a clear error instead of generating something broken.",
  },
  {
    q: "Is stackit published to npm?",
    a: "Yes! No setup needed: bunx create-stackit-app@latest create my-app --stack mern -y (or npx). Prefer a global install? npm install -g create-stackit-app gives you the stackit command everywhere. Source runners can still git clone + bun install from cli/.",
  },
];

export interface Flag {
  flag: string;
  values: string;
  def: string;
}

export const FLAGS: Flag[] = [
  { flag: "[project-name]", values: "my-app (lowercase, - _)", def: "prompt" },
  { flag: "--stack", values: "mern | pern | hono-pg | go-fiber", def: "prompt (mern with -y)" },
  { flag: "--language", values: "typescript | javascript (go-fiber → go)", def: "prompt (typescript with -y)" },
  { flag: "--runtime", values: "node | bun (go-fiber → go)", def: "prompt (stack default with -y)" },
  { flag: "--pm", values: "npm | pnpm | yarn | bun", def: "bun if runtime is bun, else npm" },
  { flag: "-y, --yes", values: "skip all prompts", def: "off" },
  { flag: "--no-install", values: "skip dependency install", def: "install" },
  { flag: "--no-git", values: "skip git init", def: "init" },
];

export const SCAFFOLD_OUTPUT = `✔ Environment looks good
✔ Scaffolded 33 files → /home/you/test-mern
✔ Done! test-mern (mern, typescript, bun)

Next steps:
  $ cd test-mern
  $ bun run dev  # runs client + server`;

export const DEMO_API = `// client/src/lib/api.ts — generated
export function getHealth(): Promise<Health> {
  return req<Health>("/api/health"); // → { status: "ok", uptime: 12 }
}`;
