"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const fs_1 = require("fs");
const utils_1 = require("./utils");
const ejs_1 = require("ejs");
const yaml_1 = require("yaml");
async function createFunction(root, fnPath) {
    const validityErrors = (0, utils_1.isValidFunctionsProject)(root);
    if (validityErrors)
        throw validityErrors;
    if (!utils_1.functionNameRegex.test(fnPath)) {
        throw "error function paths must be in the format 'package/function' (e.g. user/signup)";
    }
    const scan = (0, utils_1.scanProject)(root);
    if (scan.functions.existing.includes(fnPath)) {
        throw `error: function '${fnPath}' already exists in project`;
    }
    const [, pkgName, fnName] = utils_1.functionNameRegex.exec(fnPath);
    const srcDir = (0, path_1.resolve)(root, "src");
    const pkgDir = (0, path_1.resolve)(srcDir, pkgName);
    const fnDir = (0, path_1.resolve)(pkgDir, fnName);
    if (!(0, fs_1.existsSync)(pkgDir)) {
        (0, fs_1.mkdirSync)(pkgDir);
    }
    const templateDir = (0, path_1.resolve)(__dirname, "../templates/function");
    const templateFilesGenerator = (0, utils_1.listFiles)(templateDir, []);
    for await (const templateSrc of templateFilesGenerator) {
        const relativeSrc = (0, path_1.relative)((0, path_1.resolve)(templateDir), templateSrc);
        const templateDest = (0, path_1.resolve)((0, path_1.resolve)(fnDir), relativeSrc).replaceAll(".ejs", "");
        (0, fs_1.cpSync)(templateSrc, templateDest, { recursive: true });
        try {
            const templateData = { name: fnName };
            const content = await (0, ejs_1.renderFile)(templateSrc, templateData);
            (0, fs_1.writeFileSync)(templateDest, content);
        }
        catch (err) {
            console.warn(`warning: ${err.message}'`);
            console.warn(`warning: could not render content to '${templateDest}'`);
        }
        console.log(`created '${templateDest}'`);
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
    let pkgExists = false;
    for (const pkgConfig of projectConfig.packages) {
        if (pkgConfig.name === pkgName) {
            pkgConfig.functions.push(fnConfigEntry);
            pkgExists = true;
            break;
        }
    }
    if (!pkgExists) {
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
    console.log(`1. Update the environment, parameters and annotations for '${fnPath}'`);
    console.log(`2. Open '${(0, path_1.relative)(root, (0, path_1.resolve)(fnDir, "index.ts"))}' to edit your function`);
}
exports.default = createFunction;
