import { existsSync, readdirSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

export type FileMap = Record<string, string>;

/** Write many files in parallel. Creates parent dirs as needed. */
export async function writeFiles(root: string, files: FileMap): Promise<number> {
  const entries = Object.entries(files);
  await Promise.all(
    entries.map(async ([rel, content]) => {
      const abs = join(root, rel);
      await mkdir(dirname(abs), { recursive: true });
      await writeFile(abs, content);
    }),
  );
  return entries.length;
}

export function isEmptyDir(path: string): boolean {
  if (!existsSync(path)) return true;
  return readdirSync(path).length === 0;
}
