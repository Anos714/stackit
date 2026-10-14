import { Command } from "commander";
import * as p from "@clack/prompts";
import pc from "picocolors";
import { spinner as yoctoSpinner } from "../../utils/spinner.ts";
import { collectProjectOptions } from "../../prompts/project.ts";
import { validateEnvironment } from "../../validators/environment.ts";
import { generateProject } from "../../generators/index.ts";
import { log, nextSteps } from "../../utils/logger.ts";
import type { ProjectOptions } from "../../types/index.ts";

export const createCommand = new Command("create")
  .argument("[project-name]", "name of the project directory to create")
  .option("--stack <stack>", "stack: mern | pern | hono-pg | go-fiber")
  .option("--language <lang>", "language: typescript | javascript (go stacks use go)")
  .option("--runtime <runtime>", "runtime: node | bun (go-fiber uses go)")
  .option("--pm <pm>", "package manager: npm | pnpm | yarn | bun")
  .option("-y, --yes", "skip prompts, use defaults/flags")
  .option("--no-install", "skip dependency installation")
  .option("--no-git", "skip git init")
  .description("scaffold a new full-stack project")
  .action(async (projectName: string | undefined, opts) => {
    p.intro(pc.bold(pc.cyan("stackit — scaffold full-stack apps")));

    let options: ProjectOptions;
    try {
      options = await collectProjectOptions({
        projectName,
        stack: opts.stack,
        language: opts.language,
        runtime: opts.runtime,
        pm: opts.pm,
        yes: Boolean(opts.yes),
        install: opts.install !== false,
        git: opts.git !== false,
      });
    } catch (err) {
      if (err instanceof Error && err.message === "cancelled") {
        p.cancel("Operation cancelled.");
        process.exit(0);
      }
      throw err;
    }

    const envSpinner = yoctoSpinner({ text: "Checking environment…" }).start();
    const warnings = await validateEnvironment(options);
    if (warnings.length === 0) envSpinner.success("Environment looks good");
    else {
      envSpinner.warning("Environment has warnings");
      for (const w of warnings) log.warn(w);
    }

    const genSpinner = yoctoSpinner({ text: `Scaffolding ${options.projectName}…` }).start();
    try {
      const result = await generateProject(options);
      genSpinner.success(`Scaffolded ${result.fileCount} files → ${result.targetDir}`);
    } catch (err) {
      genSpinner.error("Scaffolding failed");
      throw err;
    }

    log.ok(`Done! ${pc.bold(options.projectName)} (${options.stack}, ${options.language}, ${options.runtime})`);
    nextSteps(options.projectName, options.packageManager, options.install);
    p.outro(pc.green("Happy hacking!"));
  });
