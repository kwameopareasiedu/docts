"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const fs_1 = require("fs");
const utils_1 = require("./utils");
const ejs_1 = require("ejs");
const yaml_1 = require("yaml");
async function createFunction(root, name) {
    const validityErrors = (0, utils_1.isValidFunctionsProject)(root);
    if (validityErrors)
        throw validityErrors;
    if (!utils_1.fnNameRegex.test(name)) {
        throw "error function names must be in the format 'package/function' (e.g. user/signup)";
    }
    const projectFns = (0, utils_1.scanProject)(root);
    if (projectFns.existing.includes(name)) {
        throw `error: function '${name}' already exists in project`;
    }
    const [, pkgName, fnName] = utils_1.fnNameRegex.exec(name);
    const srcDir = (0, path_1.resolve)(root, "src");
    const pkgDir = (0, path_1.resolve)(srcDir, pkgName);
    const fnDir = (0, path_1.resolve)(pkgDir, fnName);
    if (!(0, fs_1.existsSync)(pkgDir)) {
        (0, fs_1.mkdirSync)(pkgDir);
    }
    const templateDir = (0, path_1.resolve)(__dirname, "../templates/function");
    const templateFilesGenerator = (0, utils_1.listFiles)(templateDir, []);
    for await (const src of templateFilesGenerator) {
        const relativeSrc = (0, path_1.relative)((0, path_1.resolve)(templateDir), src);
        const dest = (0, path_1.resolve)((0, path_1.resolve)(fnDir), relativeSrc).replaceAll(".ejs", "");
        (0, fs_1.cpSync)(src, dest, { recursive: true });
        const data = { name: fnName };
        try {
            const content = await (0, ejs_1.renderFile)(src, data);
            (0, fs_1.writeFileSync)(dest, content);
        }
        catch (err) {
            console.warn(`warning: ${err.message}'`);
            console.warn(`warning: could not render content to '${dest}'`);
        }
        console.log(`created '${dest}'`);
    }
    const projectYml = (0, path_1.resolve)(root, "project.yml");
    const projectConfig = (0, yaml_1.parse)((0, fs_1.readFileSync)(projectYml, "utf-8"));
    const fnConfigEntry = {
        name: fnName,
        binary: false,
        main: "",
        runtime: "nodejs:default",
        web: true,
        parameters: {},
        environment: {},
        annotations: {},
        limits: {}
    };
    let packageExists = false;
    for (const doPkg of projectConfig.packages) {
        if (doPkg.name === pkgName) {
            doPkg.functions.push(fnConfigEntry);
            packageExists = true;
            break;
        }
    }
    if (!packageExists) {
        projectConfig.packages.push({
            name: pkgName,
            parameters: {},
            environment: {},
            annotations: {},
            functions: [fnConfigEntry]
        });
    }
    (0, fs_1.writeFileSync)(projectYml, (0, yaml_1.stringify)(projectConfig));
    console.log(`Created function in '${(0, path_1.relative)(root, fnDir)}'!\n`);
    console.log(`1. Update the environment, parameters and annotations for '${name}'`);
    console.log(`2. Open '${(0, path_1.relative)(root, (0, path_1.resolve)(fnDir, "index.ts"))}' to edit your function`);
}
exports.default = createFunction;
