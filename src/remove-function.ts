import { relative, resolve } from "path";
import { readFileSync, writeFileSync } from "fs";
import {
  DoProject,
  fnNameRegex,
  isValidFunctionsProject,
  scanProject
} from "./utils";
import { parse, stringify } from "yaml";
import { rm } from "fs/promises";

export default async function removeFunction(root: string, name: string) {
  const validityErrors = isValidFunctionsProject(root);
  if (validityErrors) throw validityErrors;

  if (!fnNameRegex.test(name)) {
    throw "error function names must be in the format 'package/function' (e.g. user/signup)";
  }

  const projectFns = scanProject(root);

  if (!projectFns.existing.includes(name)) {
    throw `error: function '${name}' does not exist in project`;
  }

  const [, pkgName, fnName] = fnNameRegex.exec(name);
  const srcDir = resolve(root, "src");
  const pkgDir = resolve(srcDir, pkgName);
  const fnDir = resolve(pkgDir, fnName);

  await rm(fnDir, { recursive: true, force: true });

  const projectYml = resolve(root, "project.yml");
  const projectConfig = parse(readFileSync(projectYml, "utf-8")) as DoProject;

  for (const doPkg of projectConfig.packages) {
    if (doPkg.name === pkgName) {
      const fnIndex = doPkg.functions.map(fn => fn.name).indexOf(fnName);

      if (fnIndex !== -1) {
        doPkg.functions.splice(fnIndex, 1);
      }

      break;
    }
  }

  writeFileSync(projectYml, stringify(projectConfig));

  console.log(`Remove function at '${relative(root, fnDir)}'!\n`);
}
