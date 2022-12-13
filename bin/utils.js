"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listFiles = exports.defaultIgnores = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
exports.defaultIgnores = [".idea/", "node_modules/", "bin/", "yarn.lock"];
async function* listFiles(dir, ignores) {
    const dirents = (0, fs_1.readdirSync)(dir, { withFileTypes: true });
    for (const dirent of dirents) {
        const res = (0, path_1.resolve)(dir, dirent.name);
        if (!ignores.includes(dirent.name) &&
            !ignores.includes(dirent.name + "/")) {
            if (dirent.isDirectory()) {
                yield* listFiles(res, ignores);
            }
            else {
                yield res;
            }
        }
    }
}
exports.listFiles = listFiles;
