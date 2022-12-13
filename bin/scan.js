"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const fs_1 = require("fs");
const yaml_1 = require("yaml");
function scan(root) {
    const projectYml = (0, path_1.resolve)(root, "project.yml");
    const srcDir = (0, path_1.resolve)(root, "src");
    if (!(0, fs_1.existsSync)(projectYml)) {
        throw `error: '${root} is not a valid functions project'. missing project.yml`;
    }
    else if (!(0, fs_1.existsSync)(srcDir)) {
        throw `error: '${root} is not a valid functions project'. missing src directory`;
    }
    const projectConfig = (0, yaml_1.parse)((0, fs_1.readFileSync)(projectYml, "utf-8"));
    const declaredFunctions = projectConfig.packages.reduce((fnNames, pkg) => {
        const pkgFns = pkg.functions;
        const pkgFnNames = pkgFns.map(fn => `${pkg.name}/${fn.name}`);
        return [...fnNames, ...pkgFnNames];
    }, []);
    const existingFunctions = (0, fs_1.readdirSync)(srcDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .reduce((fnNames, dirent) => {
        const pkgFnDirs = (0, fs_1.readdirSync)((0, path_1.resolve)(srcDir, dirent.name), {
            withFileTypes: true
        }).filter(dirent => dirent.isDirectory());
        const pkgFnNames = pkgFnDirs.map(subDirent => `${dirent.name}/${subDirent.name}`);
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
exports.default = scan;
