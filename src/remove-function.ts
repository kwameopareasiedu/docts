import { relative, resolve } from "path";
import { readFileSync, writeFileSync } from "fs";
import {
  DoProject,
  fnNameRegex,
  isValidFunctionsProject,
  pkgNameRegex,
  scanProject
} from "./utils";
import { parse, stringify } from "yaml";
import { rm } from "fs/promises";
import * as inquirer from "inquirer";

export default async function removeFunction(root: string, name: string) {
  const validityErrors = isValidFunctionsProject(root);
  if (validityErrors) throw validityErrors;

  if (fnNameRegex.test(name)) {
    await destroyFunction(root, name);
  } else if (pkgNameRegex.test(name)) {
    await destroyPackage(root, name);
  } else {
    throw "error function names must be in the format 'package/function' (e.g. user/signup) or 'package' (e.g. user)";
  }
}

const destroyFunction = async (root: string, name: string) => {
  const projectFns = scanProject(root);

  if (!projectFns.fns.existing.includes(name)) {
    throw `error: function '${name}' does not exist in project`;
  }

  const [, pkgName, fnName] = fnNameRegex.exec(name);
  const srcDir = resolve(root, "src");
  const pkgDir = resolve(srcDir, pkgName);
  const fnDir = resolve(pkgDir, fnName);

  const answers = (await inquirer.prompt([
    {
      name: "confirm",
      type: "confirm",
      message: `You are about to remove the '${name}' function. This action is destructive and cannot be reversed. Are you sure?`
    }
  ])) as any;

  if (answers.confirm === true) {
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

    console.log(`Removed function at '${relative(root, fnDir)}'!\n`);
  }
};

const destroyPackage = async (root: string, name: string) => {
  const scan = scanProject(root);

  if (!scan.pkgs.declared.includes(name)) {
    throw `error: package '${name}' does not exist in project`;
  }

  const [, pkgName] = pkgNameRegex.exec(name);
  const srcDir = resolve(root, "src");
  const pkgDir = resolve(srcDir, pkgName);

  const answers = (await inquirer.prompt([
    {
      name: "confirm",
      type: "confirm",
      message: `You are about to remove the '${name}' package and ALL of its functions. This action is destructive and cannot be reversed. Are you sure?`
    }
  ])) as any;

  if (answers.confirm === true) {
    await rm(pkgDir, { recursive: true, force: true });
    const projectYml = resolve(root, "project.yml");
    const projectConfig = parse(readFileSync(projectYml, "utf-8")) as DoProject;

    for (const doPkg of projectConfig.packages) {
      if (doPkg.name === pkgName) {
        projectConfig.packages.splice(projectConfig.packages.indexOf(doPkg), 1);
        break;
      }
    }

    writeFileSync(projectYml, stringify(projectConfig));

    console.log(`Removed package at '${relative(root, pkgDir)}'!\n`);
  }
};
