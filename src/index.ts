#!/usr/bin/env node
import { program as docts } from "commander";
import * as inquirer from "inquirer";
import init from "./init";

docts
  .name("docts")
  .description(
    "Additional features for working with Typescript serverless functions using DigitalOcean doctl"
  )
  .version("0.1.0");

docts
  .command("init")
  .description("Initializes a new Typescript doctl function project")
  .argument("<name>", "Project name")
  .action(async name => {
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
    ])) as any;

    await init(name, answers.version, answers.description, answers.author);
  });

docts.parse(process.argv);
