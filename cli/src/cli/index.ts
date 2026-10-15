import { Command } from "commander";
import { createCommand } from "./commands/create.ts";
import pkg from "../../package.json";

export function buildProgram(): Command {
  const program = new Command();
  program
    .name("stackit")
    .description("Opinionated full-stack scaffolder — MERN, PERN, Hono + Postgres, Go Fiber")
    .version(pkg.version);
  program.addCommand(createCommand);
  return program;
}
