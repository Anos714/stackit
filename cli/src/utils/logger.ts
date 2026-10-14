import pc from "picocolors";

export const log = {
  info: (msg: string) => console.log(`${pc.cyan("ℹ")} ${msg}`),
  ok: (msg: string) => console.log(`${pc.green("✔")} ${msg}`),
  warn: (msg: string) => console.log(`${pc.yellow("⚠")} ${msg}`),
  error: (msg: string) => console.error(`${pc.red("✖")} ${msg}`),
  dim: (msg: string) => console.log(pc.dim(msg)),
  title: (msg: string) => console.log(`\n${pc.bold(pc.cyan(msg))}`),
};

export function nextSteps(targetDir: string, pm: string, install: boolean): void {
  log.title("Next steps:");
  console.log(`  ${pc.dim("$")} ${pc.bold(`cd ${targetDir}`)}`);
  if (!install) {
    const cmd = pm === "npm" ? "npm install" : `${pm} install`;
    console.log(`  ${pc.dim("$")} ${pc.bold(cmd)}`);
    console.log(`  ${pc.dim("$")} ${pc.bold(`${pm === "npm" ? "npm run" : pm} dev`)}  ${pc.dim("# runs client + server")}`);
  } else {
    console.log(`  ${pc.dim("$")} ${pc.bold(`${pm === "npm" ? "npm run" : pm} dev`)}  ${pc.dim("# runs client + server")}`);
  }
}
