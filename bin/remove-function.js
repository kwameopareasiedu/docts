"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const fs_1 = require("fs");
const utils_1 = require("./utils");
const yaml_1 = require("yaml");
const promises_1 = require("fs/promises");
const inquirer = require("inquirer");
async function removeFunction(root, name) {
    const validityErrors = (0, utils_1.isValidFunctionsProject)(root);
    if (validityErrors)
        throw validityErrors;
    if (utils_1.fnNameRegex.test(name)) {
        await destroyFunction(root, name);
    }
    else if (utils_1.pkgNameRegex.test(name)) {
        await destroyPackage(root, name);
    }
    else {
        throw "error function names must be in the format 'package/function' (e.g. user/signup) or 'package' (e.g. user)";
    }
}
exports.default = removeFunction;
const destroyFunction = async (root, name) => {
    const projectFns = (0, utils_1.scanProject)(root);
    if (!projectFns.fns.existing.includes(name)) {
        throw `error: function '${name}' does not exist in project`;
    }
    const [, pkgName, fnName] = utils_1.fnNameRegex.exec(name);
    const srcDir = (0, path_1.resolve)(root, "src");
    const pkgDir = (0, path_1.resolve)(srcDir, pkgName);
    const fnDir = (0, path_1.resolve)(pkgDir, fnName);
    const answers = (await inquirer.prompt([
        {
            name: "confirm",
            type: "confirm",
            message: `You are about to remove the '${name}' function. This action is destructive and cannot be reversed. Are you sure?`
        }
    ]));
    if (answers.confirm === true) {
        await (0, promises_1.rm)(fnDir, { recursive: true, force: true });
        const projectYml = (0, path_1.resolve)(root, "project.yml");
        const projectConfig = (0, yaml_1.parse)((0, fs_1.readFileSync)(projectYml, "utf-8"));
        for (const doPkg of projectConfig.packages) {
            if (doPkg.name === pkgName) {
                const fnIndex = doPkg.functions.map(fn => fn.name).indexOf(fnName);
                if (fnIndex !== -1) {
                    doPkg.functions.splice(fnIndex, 1);
                }
                break;
            }
        }
        (0, fs_1.writeFileSync)(projectYml, (0, yaml_1.stringify)(projectConfig));
        console.log(`Removed function at '${(0, path_1.relative)(root, fnDir)}'!\n`);
    }
};
const destroyPackage = async (root, name) => {
    const scan = (0, utils_1.scanProject)(root);
    if (!scan.pkgs.declared.includes(name)) {
        throw `error: package '${name}' does not exist in project`;
    }
    const [, pkgName] = utils_1.pkgNameRegex.exec(name);
    const srcDir = (0, path_1.resolve)(root, "src");
    const pkgDir = (0, path_1.resolve)(srcDir, pkgName);
    const answers = (await inquirer.prompt([
        {
            name: "confirm",
            type: "confirm",
            message: `You are about to remove the '${name}' package and ALL of its functions. This action is destructive and cannot be reversed. Are you sure?`
        }
    ]));
    if (answers.confirm === true) {
        await (0, promises_1.rm)(pkgDir, { recursive: true, force: true });
        const projectYml = (0, path_1.resolve)(root, "project.yml");
        const projectConfig = (0, yaml_1.parse)((0, fs_1.readFileSync)(projectYml, "utf-8"));
        for (const doPkg of projectConfig.packages) {
            if (doPkg.name === pkgName) {
                projectConfig.packages.splice(projectConfig.packages.indexOf(doPkg), 1);
                break;
            }
        }
        (0, fs_1.writeFileSync)(projectYml, (0, yaml_1.stringify)(projectConfig));
        console.log(`Removed package at '${(0, path_1.relative)(root, pkgDir)}'!\n`);
    }
};
