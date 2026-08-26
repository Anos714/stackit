import { Command } from "commander";
import { collectProjectOptions } from "../../prompts/projects.prompts";

const createCommand = new Command("create")
  .argument("[project-name]", "name of the project to create")
  .description("create a new project")
  .action(async (projectName) => {
    const options = await collectProjectOptions(projectName);
    await validateEnvironment(options);
    await generateProject(options);
  });

export { createCommand };
