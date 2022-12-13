#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const init_1 = require("./init");
commander_1.program
    .name("docts")
    .description("Additional features for working with Typescript serverless functions using DigitalOcean doctl")
    .version("0.1.0");
commander_1.program
    .command("init")
    .description("Initializes a new Typescript doctl function project")
    .argument("<name>", "Project name")
    .action(async (name) => {
    await (0, init_1.default)(name);
});
commander_1.program.parse(process.argv);
