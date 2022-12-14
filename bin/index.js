#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const inquirer = require("inquirer");
const init_1 = require("./init");
const create_function_1 = require("./create-function");
const utils_1 = require("./utils");
const remove_function_1 = require("./remove-function");
commander_1.program
    .name("docts")
    .description("Additional features for working with Typescript serverless functions using DigitalOcean doctl")
    .version("0.1.0");
commander_1.program
    .command("init")
    .description("Initialize a new Typescript doctl function project")
    .argument("<name>", "Project name")
    .action(async (name) => {
    try {
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
    }
    catch (err) {
        console.error(err.message || err.toString());
    }
});
commander_1.program
    .command("scan")
    .description("Scan a project and return a map of packages and functions")
    .action(() => {
    try {
        const scan = (0, utils_1.scanProject)(process.cwd());
        if (scan.functions.missing.length > 0) {
            console.error("error: project.yml declares missing functions:");
            scan.functions.missing.forEach(pkg => console.error(`- ${pkg}`));
            console.error("remove missing functions from project.yml or create them");
            return;
        }
        console.dir(scan, { depth: null });
    }
    catch (err) {
        console.error(err.message || err.toString());
    }
});
commander_1.program.addCommand((() => {
    const fn = new commander_1.Command("fn");
    fn.description("Manage functions in project");
    fn.command("new")
        .description("Create a new function and update project.yml")
        .argument("<name>", "Function name (e.g. user/signup)")
        .action(async (name) => {
        try {
            await (0, create_function_1.default)(process.cwd(), name);
        }
        catch (err) {
            console.error(err.message || err.toString());
        }
    });
    fn.command("remove")
        .description("Remove a function/package and update project.yml")
        .argument("<name>", "Function name (e.g. user/signup) or package name (e.g. user)")
        .action(async (name) => {
        try {
            await (0, remove_function_1.default)(process.cwd(), name);
        }
        catch (err) {
            console.error(err.message || err.toString());
        }
    });
    return fn;
})());
commander_1.program.parse(process.argv);
