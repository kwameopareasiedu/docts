"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const fs_1 = require("fs");
const utils_1 = require("./utils");
const yaml_1 = require("yaml");
const promises_1 = require("fs/promises");
const inquirer = require("inquirer");
async function removeFunction(root, fnPath) {
    const validityErrors = (0, utils_1.isValidFunctionsProject)(root);
    if (validityErrors)
        throw validityErrors;
    if (utils_1.functionNameRegex.test(fnPath)) {
        await destroyFunction(root, fnPath);
    }
    else if (utils_1.packageNameRegex.test(fnPath)) {
        await destroyPackage(root, fnPath);
    }
    else {
        throw "error function names must be in the format 'package/function' (e.g. user/signup) or 'package' (e.g. user)";
    }
}
exports.default = removeFunction;
const destroyFunction = async (root, fnPath) => {
    const projectFns = (0, utils_1.scanProject)(root);
    if (!projectFns.functions.existing.includes(fnPath)) {
        throw `error: function '${fnPath}' does not exist in project`;
    }
    const [, pkgName, fnName] = utils_1.functionNameRegex.exec(fnPath);
    const srcDir = (0, path_1.resolve)(root, "src");
    const pkgDir = (0, path_1.resolve)(srcDir, pkgName);
    const fnDir = (0, path_1.resolve)(pkgDir, fnName);
    const answers = (await inquirer.prompt([
        {
            name: "confirm",
            type: "confirm",
            message: `You are about to remove the '${fnPath}' function. This action is destructive and cannot be reversed. Are you sure?`
        }
    ]));
    if (answers.confirm === true) {
        await (0, promises_1.rm)(fnDir, { recursive: true, force: true });
        const projectYml = (0, path_1.resolve)(root, "project.yml");
        const projectConfig = (0, yaml_1.parse)((0, fs_1.readFileSync)(projectYml, "utf-8"));
        for (const pkgConfig of projectConfig.packages) {
            if (pkgConfig.name === pkgName) {
                const fnIndex = pkgConfig.functions.map(fn => fn.name).indexOf(fnName);
                if (fnIndex !== -1) {
                    pkgConfig.functions.splice(fnIndex, 1);
                }
                break;
            }
        }
        (0, fs_1.writeFileSync)(projectYml, (0, yaml_1.stringify)(projectConfig));
        console.log(`Removed function at '${(0, path_1.relative)(root, fnDir)}'!\n`);
    }
};
const destroyPackage = async (root, pkgPath) => {
    const scan = (0, utils_1.scanProject)(root);
    if (!scan.packages.declared.includes(pkgPath)) {
        throw `error: package '${pkgPath}' does not exist in project`;
    }
    const [, pkgName] = utils_1.packageNameRegex.exec(pkgPath);
    const srcDir = (0, path_1.resolve)(root, "src");
    const pkgDir = (0, path_1.resolve)(srcDir, pkgName);
    const answers = (await inquirer.prompt([
        {
            name: "confirm",
            type: "confirm",
            message: `You are about to remove the '${pkgPath}' package and ALL of its functions. This action is destructive and cannot be reversed. Are you sure?`
        }
    ]));
    if (answers.confirm === true) {
        await (0, promises_1.rm)(pkgDir, { recursive: true, force: true });
        const projectYml = (0, path_1.resolve)(root, "project.yml");
        const projectConfig = (0, yaml_1.parse)((0, fs_1.readFileSync)(projectYml, "utf-8"));
        for (const pkgConfig of projectConfig.packages) {
            if (pkgConfig.name === pkgName) {
                projectConfig.packages.splice(projectConfig.packages.indexOf(pkgConfig), 1);
                break;
            }
        }
        (0, fs_1.writeFileSync)(projectYml, (0, yaml_1.stringify)(projectConfig));
        console.log(`Removed package at '${(0, path_1.relative)(root, pkgDir)}'!\n`);
    }
};
