export type StackId = "mern" | "pern" | "hono-pg" | "go-fiber" | "fastapi" | "nestjs";

export type Language = "typescript" | "javascript" | "go" | "python";

export type Runtime = "node" | "bun" | "go" | "python";

export type PackageManager = "npm" | "pnpm" | "yarn" | "bun";

export interface ProjectOptions {
  projectName: string;
  stack: StackId;
  language: Language;
  runtime: Runtime;
  packageManager: PackageManager;
  install: boolean;
  git: boolean;
  targetDir: string;
}

export interface StackRequirement {
  tool: string;
  minVersion: string;
  hint: string;
}

export interface StackDef {
  id: StackId;
  label: string;
  description: string;
  frontend: "vite-react" | "nextjs";
  backend: "express" | "hono" | "fiber" | "fastapi" | "nestjs";
  database: "mongodb" | "postgres" | "none";
  languages: readonly Language[];
  runtimes: readonly Runtime[];
  packageManagers: readonly PackageManager[];
  requirements: readonly StackRequirement[];
  defaultRuntime: Runtime;
}
