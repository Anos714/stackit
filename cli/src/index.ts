#!/usr/bin/env node
import { buildProgram } from "./cli/index.ts";

const program = buildProgram();
// process.argv works identically under Bun and Node (unlike Bun.argv).
await program.parseAsync(process.argv);
