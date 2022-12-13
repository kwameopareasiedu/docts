#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const inquirer = require("inquirer");
const init_1 = require("./init");
const create_function_1 = require("./create-function");
const utils_1 = require("./utils");
commander_1.program
    .name("docts")
    .description("Additional features for working with Typescript serverless functions using DigitalOcean doctl")
    .version("0.1.0");
commander_1.program
    .command("init")
    .description("Initialize a new Typescript doctl function project")
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
    .description("Scan a project and creates an internal map of functions")
    .action(() => {
    try {
        const projectFns = (0, utils_1.scanProject)(process.cwd());
        if (projectFns.missing.length > 0) {
            console.error("error: project.yml declares missing functions:");
            projectFns.missing.forEach(pkg => console.error(`- ${pkg}`));
            console.error("remove missing functions from project.yml or create them");
            return;
        }
    }
    catch (err) {
        console.error(err.message || err.toString());
    }
});
commander_1.program
    .command("fn")
    .description("Create a new function directory and update project.yml")
    .argument("<name>", "Function name <package/function> (e.g. user/signup")
    .action(async (name) => {
    try {
        await (0, create_function_1.default)(process.cwd(), name);
    }
    catch (err) {
        console.error(err.message || err.toString());
    }
});
commander_1.program.parse(process.argv);
