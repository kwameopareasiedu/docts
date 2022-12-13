import { existsSync, readdirSync } from "fs";
import { normalize, resolve } from "path";
import { rm } from "fs/promises";

export const defaultIgnores = [".idea/", "node_modules/", "bin/", "yarn.lock"];

export const tempDir = resolve(process.cwd(), "temp");

export async function* listFiles(
  dir: string,
  ignores: Array<string>,
  includeDirs = false
): AsyncGenerator<any> {
  const dirents = readdirSync(dir, { withFileTypes: true });

  for (const dirent of dirents) {
    const res = resolve(dir, dirent.name);

    if (
      !ignores.includes(dirent.name) &&
      !ignores.includes(dirent.name + "/")
    ) {
      if (dirent.isDirectory()) {
        if (includeDirs) yield res;

        yield* listFiles(res, ignores, includeDirs);
      } else yield res;
    }
  }
}

export const resetTempDirectory = async () => {
  if (!existsSync(tempDir)) return;

  const gitignoreFile = resolve(tempDir, ".gitignore");
  const listGen = listFiles(tempDir, [], true);

  try {
    for await (const dirent of listGen) {
      if (normalize(dirent) !== normalize(gitignoreFile)) {
        await rm(dirent, { recursive: true, force: true });
      }
    }
  } catch (err) {
    console.log(err);
  }
};

export interface DoPackage {
  readonly name: string;
  readonly environment?: Record<string, string>;
  readonly parameters?: Record<string, string>;
  readonly annotations?: Record<string, string>;
  readonly functions?: Array<DoFunction>;
}

export interface DoFunction extends DoPackage {
  binary?: boolean;
  main?: string;
  runtime?: string;
  web: boolean;
  limits: Record<string, string>;
}
