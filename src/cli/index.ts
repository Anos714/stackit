import { Command } from "commander";
import { createCommand } from "./commands/create.ts";

export function buildProgram(): Command {
  const program = new Command();
  program
    .name("stackit")
    .description("Opinionated full-stack scaffolder — MERN, PERN, Hono + Postgres, Go Fiber")
    .version("0.1.0");
  program.addCommand(createCommand);
  return program;
}
