#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const inquirer = require("inquirer");
const init_1 = require("./init");
const scan_1 = require("./scan");
commander_1.program
    .name("docts")
    .description("Additional features for working with Typescript serverless functions using DigitalOcean doctl")
    .version("0.1.0");
commander_1.program
    .command("init")
    .description("Initializes a new Typescript doctl function project")
    .argument("<name>", "Project name")
    .action(async (name) => {
    const answers = (await inquirer.prompt([
        {
            name: "description",
            type: "input",
            message: "Project description"
        },
        {
            name: "author",
            type: "input",
            message: "Author"
        },
        {
            name: "version",
            type: "input",
            message: "Version"
        }
    ]));
    await (0, init_1.default)(name, answers.version, answers.description, answers.author);
});
commander_1.program
    .command("scan")
    .description("Scans a project and creates an internal map of functions")
    .action(() => {
    try {
        const functions = (0, scan_1.default)(process.cwd());
        if (functions.missing.length > 0) {
            console.error("error: project.yml declares missing functions:");
            functions.missing.forEach(pkg => console.error(`- ${pkg}`));
            console.error("remove missing functions from project.yml or create them");
            return;
        }
    }
    catch (err) {
        console.error(err.message);
    }
});
commander_1.program.parse(process.argv);
