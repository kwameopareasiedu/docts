import { existsSync, readdirSync, readFileSync } from "fs";
import { normalize, resolve } from "path";
import { rm } from "fs/promises";
import { parse } from "yaml";

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

export const isValidFunctionsProject = (root: string) => {
  const projectYml = resolve(root, "project.yml");
  const srcDir = resolve(root, "src");

  if (!existsSync(projectYml)) {
    return `error: '${root} is not a valid functions project'. missing project.yml`;
  }

  if (!existsSync(srcDir)) {
    return `error: '${root} is not a valid functions project'. missing src directory`;
  }

  return null;
};

export const scanProject = (root: string) => {
  const validityErrors = isValidFunctionsProject(root);
  if (validityErrors) throw validityErrors;

  const projectYml = resolve(root, "project.yml");
  const srcDir = resolve(root, "src");
  const projectConfig = parse(readFileSync(projectYml, "utf-8"));

  const declaredFunctions = (projectConfig.packages as Array<DoPackage>).reduce(
    (fnNames, pkg) => {
      const pkgFns = pkg.functions;
      const pkgFnNames = pkgFns.map(fn => `${pkg.name}/${fn.name}`);
      return [...fnNames, ...pkgFnNames];
    },
    []
  );

  const existingFunctions = readdirSync(srcDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .reduce((fnNames, dirent) => {
      const pkgFnDirs = readdirSync(resolve(srcDir, dirent.name), {
        withFileTypes: true
      }).filter(dirent => dirent.isDirectory());

      const pkgFnNames = pkgFnDirs.map(
        subDirent => `${dirent.name}/${subDirent.name}`
      );

      return [...fnNames, ...pkgFnNames];
    }, []);

  const missingFunctions = [];

  for (const pkg of declaredFunctions) {
    if (!existingFunctions.includes(pkg)) {
      missingFunctions.push(pkg);
    }
  }

  const undeclaredFunctions = [];

  for (const pkg of existingFunctions) {
    if (!declaredFunctions.includes(pkg)) {
      undeclaredFunctions.push(pkg);
    }
  }

  return {
    declared: declaredFunctions,
    existing: existingFunctions,
    missing: missingFunctions,
    undeclared: undeclaredFunctions
  };
};

export interface DoProject {
  readonly environment?: Record<string, string>;
  readonly parameters?: Record<string, string>;
  readonly packages: Array<DoPackage>;
}

export interface DoPackage extends Omit<DoProject, "packages"> {
  readonly name: string;
  readonly annotations?: Record<string, string>;
  readonly functions: Array<DoFunction>;
}

export interface DoFunction extends Omit<DoPackage, "functions"> {
  binary?: boolean;
  main?: string;
  runtime?: string;
  web?: boolean;
  limits?: Record<string, string>;
}
