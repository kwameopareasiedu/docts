import { relative, resolve } from "path";
import { readFileSync, writeFileSync } from "fs";
import {
  DoProject,
  functionNameRegex,
  isValidFunctionsProject,
  packageNameRegex,
  scanProject
} from "./utils";
import { parse, stringify } from "yaml";
import { rm } from "fs/promises";
import * as inquirer from "inquirer";

export default async function removeFunction(root: string, fnPath: string) {
  const validityErrors = isValidFunctionsProject(root);

  if (validityErrors) throw validityErrors;

  if (functionNameRegex.test(fnPath)) {
    await destroyFunction(root, fnPath);
  } else if (packageNameRegex.test(fnPath)) {
    await destroyPackage(root, fnPath);
  } else {
    throw "error function names must be in the format 'package/function' (e.g. user/signup) or 'package' (e.g. user)";
  }
}

const destroyFunction = async (root: string, fnPath: string) => {
  const projectFns = scanProject(root);

  if (!projectFns.functions.existing.includes(fnPath)) {
    throw `error: function '${fnPath}' does not exist in project`;
  }

  const [, pkgName, fnName] = functionNameRegex.exec(fnPath);
  const srcDir = resolve(root, "src");
  const pkgDir = resolve(srcDir, pkgName);
  const fnDir = resolve(pkgDir, fnName);

  const answers = (await inquirer.prompt([
    {
      name: "confirm",
      type: "confirm",
      message: `You are about to remove the '${fnPath}' function. This action is destructive and cannot be reversed. Are you sure?`
    }
  ])) as any;

  if (answers.confirm === true) {
    await rm(fnDir, { recursive: true, force: true });
    const projectYml = resolve(root, "project.yml");
    const projectConfig = parse(readFileSync(projectYml, "utf-8")) as DoProject;

    for (const pkgConfig of projectConfig.packages) {
      if (pkgConfig.name === pkgName) {
        const fnIndex = pkgConfig.functions.map(fn => fn.name).indexOf(fnName);

        if (fnIndex !== -1) {
          pkgConfig.functions.splice(fnIndex, 1);
        }

        break;
      }
    }

    writeFileSync(projectYml, stringify(projectConfig));

    console.log(`Removed function at '${relative(root, fnDir)}'!\n`);
  }
};

const destroyPackage = async (root: string, pkgPath: string) => {
  const scan = scanProject(root);

  if (!scan.packages.declared.includes(pkgPath)) {
    throw `error: package '${pkgPath}' does not exist in project`;
  }

  const [, pkgName] = packageNameRegex.exec(pkgPath);
  const srcDir = resolve(root, "src");
  const pkgDir = resolve(srcDir, pkgName);

  const answers = (await inquirer.prompt([
    {
      name: "confirm",
      type: "confirm",
      message: `You are about to remove the '${pkgPath}' package and ALL of its functions. This action is destructive and cannot be reversed. Are you sure?`
    }
  ])) as any;

  if (answers.confirm === true) {
    await rm(pkgDir, { recursive: true, force: true });
    const projectYml = resolve(root, "project.yml");
    const projectConfig = parse(readFileSync(projectYml, "utf-8")) as DoProject;

    for (const pkgConfig of projectConfig.packages) {
      if (pkgConfig.name === pkgName) {
        projectConfig.packages.splice(
          projectConfig.packages.indexOf(pkgConfig),
          1
        );
        break;
      }
    }

    writeFileSync(projectYml, stringify(projectConfig));

    console.log(`Removed package at '${relative(root, pkgDir)}'!\n`);
  }
};
