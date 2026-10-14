#!/usr/bin/env bun
import { buildProgram } from "./cli/index.ts";

const program = buildProgram();
await program.parseAsync(Bun.argv);
