"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const utils_1 = require("./utils");
async function buildProject(root) {
    const validityErrors = (0, utils_1.isValidFunctionsProject)(root);
    if (validityErrors)
        throw validityErrors;
    const scan = (0, utils_1.scanProject)(root);
    const srcDir = (0, path_1.resolve)(root, "src");
    const fnDirs = scan.functions.existing.map(fnPath => (0, path_1.resolve)(srcDir, fnPath));
    // if (scan.functions.existing.includes(fnPath)) {
    //   throw `error: function '${fnPath}' already exists in project`;
    // }
}
exports.default = buildProject;
