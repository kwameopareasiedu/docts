"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const fs_1 = require("fs");
const utils_1 = require("./utils");
const ejs_1 = require("ejs");
async function init(name) {
    const projectDir = (0, path_1.resolve)(process.cwd(), name);
    const templateDir = (0, path_1.resolve)(__dirname, "../templates/project");
    const destFiles = (0, fs_1.existsSync)(projectDir) ? (0, fs_1.readdirSync)(projectDir) : [];
    if (destFiles.length > 0) {
        return `error: destination '${(0, path_1.resolve)(projectDir)}' is not empty`;
    }
    const templateFilesGenerator = (0, utils_1.listFiles)(templateDir, []);
    for await (const src of templateFilesGenerator) {
        const relativeSrc = (0, path_1.relative)((0, path_1.resolve)(templateDir), src);
        const dest = (0, path_1.resolve)((0, path_1.resolve)(projectDir), relativeSrc).replaceAll(".ejs", "");
        (0, fs_1.cpSync)(src, dest, { recursive: true });
        try {
            const content = await (0, ejs_1.renderFile)(src);
            (0, fs_1.writeFileSync)(dest, content);
        }
        catch (err) {
            console.warn(`warning: ${err.message}'`);
            console.warn(`warning: could not render content to '${dest}'`);
        }
        console.log(`created '${dest}'`);
    }
    console.log(`Scaffolded project in '${projectDir}'!\n`);
    console.log(`1. 'cd ${name}'`);
    console.log("2. 'yarn install' to install dependencies");
    console.log("3. 'yarn dev' to watch files for changes");
    console.log("4. Get started with DigitalOcean functions: https://docs.digitalocean.com/products/functions/");
}
exports.default = init;
