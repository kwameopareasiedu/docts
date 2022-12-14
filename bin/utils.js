"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scanProject = exports.isValidFunctionsProject = exports.resetTempDirectory = exports.listFiles = exports.packageNameRegex = exports.functionNameRegex = exports.tempDir = exports.defaultIgnores = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const promises_1 = require("fs/promises");
const yaml_1 = require("yaml");
exports.defaultIgnores = [".idea/", "node_modules/", "bin/", "yarn.lock"];
exports.tempDir = (0, path_1.resolve)(process.cwd(), "temp");
exports.functionNameRegex = RegExp("^(\\w[\\w|-]+)\\/(\\w[\\w|-]+)$");
exports.packageNameRegex = RegExp("^(\\w[\\w|-]+)$");
async function* listFiles(root, ignores, includeDirs = false) {
    const dirents = (0, fs_1.readdirSync)(root, { withFileTypes: true });
    for (const dirent of dirents) {
        const res = (0, path_1.resolve)(root, dirent.name);
        if (!ignores.includes(dirent.name) &&
            !ignores.includes(dirent.name + "/")) {
            if (dirent.isDirectory()) {
                if (includeDirs)
                    yield res;
                yield* listFiles(res, ignores, includeDirs);
            }
            else
                yield res;
        }
    }
}
exports.listFiles = listFiles;
const resetTempDirectory = async () => {
    if (!(0, fs_1.existsSync)(exports.tempDir))
        return;
    const gitignoreFile = (0, path_1.resolve)(exports.tempDir, ".gitignore");
    const listGen = listFiles(exports.tempDir, [], true);
    try {
        for await (const dirent of listGen) {
            if ((0, path_1.normalize)(dirent) !== (0, path_1.normalize)(gitignoreFile)) {
                await (0, promises_1.rm)(dirent, { recursive: true, force: true });
            }
        }
    }
    catch (err) {
        console.log(err);
    }
};
exports.resetTempDirectory = resetTempDirectory;
const isValidFunctionsProject = (root) => {
    const projectYml = (0, path_1.resolve)(root, "project.yml");
    const srcDir = (0, path_1.resolve)(root, "src");
    if (!(0, fs_1.existsSync)(projectYml)) {
        return `error: '${root} is not a valid functions project'. missing project.yml`;
    }
    if (!(0, fs_1.existsSync)(srcDir)) {
        return `error: '${root} is not a valid functions project'. missing src directory`;
    }
    return null;
};
exports.isValidFunctionsProject = isValidFunctionsProject;
const scanProject = (root) => {
    const validityErrors = (0, exports.isValidFunctionsProject)(root);
    if (validityErrors)
        throw validityErrors;
    const projectYml = (0, path_1.resolve)(root, "project.yml");
    const srcDir = (0, path_1.resolve)(root, "src");
    const projectConfig = (0, yaml_1.parse)((0, fs_1.readFileSync)(projectYml, "utf-8"));
    const declaredPackages = projectConfig.packages;
    const declaredFunctions = declaredPackages.reduce((fnNames, pkg) => {
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
    for (const fn of declaredFunctions) {
        if (!existingFunctions.includes(fn)) {
            missingFunctions.push(fn);
        }
    }
    const undeclaredFunctions = [];
    for (const fn of existingFunctions) {
        if (!declaredFunctions.includes(fn)) {
            undeclaredFunctions.push(fn);
        }
    }
    return {
        packages: {
            declared: declaredPackages.map(pkg => pkg.name)
        },
        functions: {
            declared: declaredFunctions,
            existing: existingFunctions,
            missing: missingFunctions,
            undeclared: undeclaredFunctions
        }
    };
};
exports.scanProject = scanProject;
