import { resolve } from "path";
import { existsSync, readdirSync, readFileSync } from "fs";
import { parse } from "yaml";
import { DoPackage } from "./utils";

export default function scan(root: string) {
  const projectYml = resolve(root, "project.yml");
  const srcDir = resolve(root, "src");

  if (!existsSync(projectYml)) {
    throw `error: '${root} is not a valid functions project'. missing project.yml`;
  } else if (!existsSync(srcDir)) {
    throw `error: '${root} is not a valid functions project'. missing src directory`;
  }

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
}
