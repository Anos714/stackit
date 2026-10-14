import type { ProjectOptions } from "../types/index.ts";

export interface GenerateResult {
  targetDir: string;
  fileCount: number;
}

// STUB — real generators land in feature/generators-templates.
export async function generateProject(_options: ProjectOptions): Promise<GenerateResult> {
  throw new Error("not implemented yet");
}
