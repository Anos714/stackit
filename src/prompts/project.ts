import * as p from "@clack/prompts";
import { z } from "zod";
import { existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { STACKS, STACK_IDS, getStack } from "../config/stacks.ts";
import type {
  Language,
  PackageManager,
  ProjectOptions,
  Runtime,
  StackId,
} from "../types/index.ts";

export interface RawFlags {
  projectName?: string;
  stack?: string;
  language?: string;
  runtime?: string;
  pm?: string;
  yes?: boolean;
  install?: boolean;
  git?: boolean;
}

const nameSchema = z
  .string()
  .min(1, "project name is required")
  .max(50, "project name must be ≤ 50 chars")
  .regex(
    /^[a-z0-9][a-z0-9-_]*$/,
    "lowercase letters, numbers, '-' and '_' only (must start alphanumeric)",
  );

const stackSchema = z.enum(STACK_IDS as [StackId, ...StackId[]]);

function fail(message: string): never {
  throw new Error(message);
}

function parseOrFail<T>(schema: z.ZodType<T>, value: unknown, flag: string): T {
  const res = schema.safeParse(value);
  if (!res.success) fail(`Invalid --${flag}: ${res.error.issues[0]?.message ?? "bad value"}`);
  return res.data as T;
}

function cancelled<T>(v: unknown): T {
  if (p.isCancel(v)) throw new Error("cancelled");
  return v as T;
}

function dirIsNonEmpty(dir: string): boolean {
  return existsSync(dir) && readdirSync(dir).length > 0;
}

async function resolveName(arg: string | undefined, yes: boolean): Promise<string> {
  if (arg) return parseOrFail(nameSchema, arg.trim(), "project-name");
  if (yes) fail("Project name is required with --yes (pass it as argument or --stack etc.)");
  const v = cancelled<string | symbol>(
    await p.text({
      message: "Project name?",
      placeholder: "my-app",
      validate: (v) => {
        const r = nameSchema.safeParse(v?.trim() ?? "");
        return r.success ? undefined : r.error.issues[0]?.message;
      },
    }),
  );
  return (v as string).trim();
}

async function resolveStack(flag: string | undefined, yes: boolean): Promise<StackId> {
  if (flag) return parseOrFail(stackSchema, flag, "stack");
  if (yes) return "mern";
  const v = cancelled<unknown>(
    await p.select({
      message: "Pick a stack:",
      options: STACK_IDS.map((id) => ({
        value: id,
        label: STACKS[id].label,
        hint: STACKS[id].description,
      })),
    }),
  );
  return v as StackId;
}

async function resolveLanguage(stack: StackId, flag: string | undefined, yes: boolean): Promise<Language> {
  const allowed = getStack(stack).languages;
  if (allowed.length === 1) return allowed[0] as Language;
  const schema = z.enum(allowed as [Language, ...Language[]]);
  if (flag) {
    const lang = parseOrFail(schema, flag, "language");
    return lang;
  }
  if (yes) return "typescript";
  const v = cancelled<unknown>(
    await p.select({
      message: "Language?",
      options: allowed.map((l) => ({
        value: l,
        label: l === "typescript" ? "TypeScript (recommended)" : "JavaScript",
      })),
    }),
  );
  return v as Language;
}

async function resolveRuntime(stack: StackId, flag: string | undefined, yes: boolean): Promise<Runtime> {
  const allowed = getStack(stack).runtimes;
  if (allowed.length === 1) return allowed[0] as Runtime;
  const schema = z.enum(allowed as [Runtime, ...Runtime[]]);
  if (flag) return parseOrFail(schema, flag, "runtime");
  if (yes) return getStack(stack).defaultRuntime;
  const v = cancelled<unknown>(
    await p.select({
      message: "Runtime?",
      options: allowed.map((r) => ({
        value: r,
        label: r === "bun" ? "Bun (fast, TS-native)" : "Node.js (LTS)",
      })),
    }),
  );
  return v as Runtime;
}

async function resolvePm(
  stack: StackId,
  runtime: Runtime,
  flag: string | undefined,
  yes: boolean,
): Promise<PackageManager> {
  const allowed = getStack(stack).packageManagers;
  if (allowed.length === 0) return "npm"; // go-fiber: unused placeholder
  const schema = z.enum(allowed as [PackageManager, ...PackageManager[]]);
  if (flag) return parseOrFail(schema, flag, "pm");
  if (yes) return runtime === "bun" ? "bun" : "npm";
  const v = cancelled<unknown>(
    await p.select({
      message: "Package manager?",
      initialValue: runtime === "bun" ? "bun" : "npm",
      options: allowed.map((m) => ({ value: m, label: m })),
    }),
  );
  return v as PackageManager;
}

/** Collect final options: flags win, prompts fill the rest, --yes never prompts. */
export async function collectProjectOptions(flags: RawFlags): Promise<ProjectOptions> {
  const yes = Boolean(flags.yes);
  const projectName = await resolveName(flags.projectName, yes);
  const stack = await resolveStack(flags.stack, yes);
  const language = await resolveLanguage(stack, flags.language, yes);
  const runtime = await resolveRuntime(stack, flags.runtime, yes);
  const packageManager = await resolvePm(stack, runtime, flags.pm, yes);

  const targetDir = resolve(process.cwd(), projectName);
  if (dirIsNonEmpty(targetDir) && !yes) {
    const go = cancelled<boolean | symbol>(
      await p.confirm({
        message: `"${projectName}/" is not empty. Scaffold into it anyway?`,
        initialValue: false,
      }),
    );
    if (!go) throw new Error("cancelled");
  }

  return {
    projectName,
    stack,
    language,
    runtime,
    packageManager,
    install: flags.install !== false,
    git: flags.git !== false,
    targetDir,
  };
}
