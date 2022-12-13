"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const fs_1 = require("fs");
const utils_1 = require("./utils");
const yaml_1 = require("yaml");
const promises_1 = require("fs/promises");
async function removeFunction(root, name) {
    const validityErrors = (0, utils_1.isValidFunctionsProject)(root);
    if (validityErrors)
        throw validityErrors;
    if (!utils_1.fnNameRegex.test(name)) {
        throw "error function names must be in the format 'package/function' (e.g. user/signup)";
    }
    const projectFns = (0, utils_1.scanProject)(root);
    if (!projectFns.existing.includes(name)) {
        throw `error: function '${name}' does not exist in project`;
    }
    const [, pkgName, fnName] = utils_1.fnNameRegex.exec(name);
    const srcDir = (0, path_1.resolve)(root, "src");
    const pkgDir = (0, path_1.resolve)(srcDir, pkgName);
    const fnDir = (0, path_1.resolve)(pkgDir, fnName);
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
    console.log(`Remove function at '${(0, path_1.relative)(root, fnDir)}'!\n`);
}
exports.default = removeFunction;
