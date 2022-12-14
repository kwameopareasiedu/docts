import { existsSync, readdirSync, readFileSync } from "fs";
import { dirname, normalize, resolve } from "path";
import { rm } from "fs/promises";
import { parse } from "yaml";
import { fileURLToPath } from "url";

export const defaultIgnores = [".idea/", "node_modules/", "bin/", "yarn.lock"];

export const tempDir = resolve(process.cwd(), "temp");

export const functionNameRegex = RegExp("^(\\w[\\w|-]+)\\/(\\w[\\w|-]+)$");

export const packageNameRegex = RegExp("^(\\w[\\w|-]+)$");

export async function* listFiles(
  root: string,
  ignores: Array<string>,
  includeDirs = false
): AsyncGenerator<any> {
  const dirents = readdirSync(root, { withFileTypes: true });

  for (const dirent of dirents) {
    const res = resolve(root, dirent.name);

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

export const polyfillGlobals = () => {
  // eslint-disable-next-line no-global-assign
  global.__dirname = dirname(fileURLToPath(import.meta.url));
};

export const ensureRootIsValidFunctionsProject = (root: string) => {
  const packageJson = resolve(root, "package.json");
  const projectYml = resolve(root, "project.yml");
  const srcDir = resolve(root, "src");

  if (!existsSync(packageJson)) {
    throw `error: '${root} is not a valid functions project'. missing package.json`;
  }

  if (!existsSync(projectYml)) {
    throw `error: '${root} is not a valid functions project'. missing project.yml`;
  }

  if (!existsSync(srcDir)) {
    throw `error: '${root} is not a valid functions project'. missing src directory`;
  }
};

export const scanProject = (root: string) => {
  ensureRootIsValidFunctionsProject(root);

  const projectYml = resolve(root, "project.yml");
  const srcDir = resolve(root, "src");
  const projectConfig = parse(readFileSync(projectYml, "utf-8"));

  const declaredPackages = projectConfig.packages as Array<DoPackage>;

  const declaredFunctions = declaredPackages.reduce((fnNames, pkg) => {
    const pkgFns = pkg.functions;
    const pkgFnNames = pkgFns.map(fn => `${pkg.name}/${fn.name}`);
    return [...fnNames, ...pkgFnNames];
  }, []);

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

  for (const fn of declaredFunctions) {
    if (!existingFunctions.includes(fn)) {
      missingFunctions.push(fn);
    }
  }

  const undeclaredFunctions = [];

  for (const fn of existingFunctions) {
    if (!declaredFunctions.includes(fn)) {
      undeclaredFunctions.push(fn);
    }
  }

  return {
    packages: {
      declared: declaredPackages.map(pkg => pkg.name)
    },
    functions: {
      declared: declaredFunctions,
      existing: existingFunctions,
      missing: missingFunctions,
      undeclared: undeclaredFunctions
    }
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

export interface NpmProject {
  readonly name?: Record<string, string>;
  readonly dependencies: Record<string, string>;
}
