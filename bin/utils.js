"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetTempDirectory = exports.listFiles = exports.tempDir = exports.defaultIgnores = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const promises_1 = require("fs/promises");
exports.defaultIgnores = [".idea/", "node_modules/", "bin/", "yarn.lock"];
exports.tempDir = (0, path_1.resolve)(process.cwd(), "temp");
async function* listFiles(dir, ignores, includeDirs = false) {
    const dirents = (0, fs_1.readdirSync)(dir, { withFileTypes: true });
    for (const dirent of dirents) {
        const res = (0, path_1.resolve)(dir, dirent.name);
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
