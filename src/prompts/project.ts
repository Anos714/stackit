import type { ProjectOptions } from "../types/index.ts";

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

// STUB — full interactive prompts land in feature/prompts-validation.
export async function collectProjectOptions(_flags: RawFlags): Promise<ProjectOptions> {
  throw new Error("not implemented yet");
}
