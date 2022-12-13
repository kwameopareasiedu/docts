#!/usr/bin/env node
import { Command, program as docts } from "commander";
import * as inquirer from "inquirer";
import init from "./init";
import createFunction from "./create-function";
import { scanProject } from "./utils";
import removeFunction from "./remove-function";

docts
  .name("docts")
  .description(
    "Additional features for working with Typescript serverless functions using DigitalOcean doctl"
  )
  .version("0.1.0");

docts
  .command("init")
  .description("Initialize a new Typescript doctl function project")
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

docts
  .command("scan")
  .description("Scan a project and creates an internal map of functions")
  .action(() => {
    try {
      const projectFns = scanProject(process.cwd());

      if (projectFns.fns.missing.length > 0) {
        console.error("error: project.yml declares missing functions:");
        projectFns.fns.missing.forEach(pkg => console.error(`- ${pkg}`));
        console.error(
          "remove missing functions from project.yml or create them"
        );
        return;
      }

      console.dir(projectFns, { depth: null });
    } catch (err) {
      console.error(err.message || err.toString());
    }
  });

docts.addCommand(
  (() => {
    const fn = new Command("fn");

    fn.description("Manage functions in project");

    fn.command("new")
      .description("Create a new function directory and update project.yml")
      .argument("<name>", "Function name <package/function> (e.g. user/signup")
      .action(async name => {
        try {
          await createFunction(process.cwd(), name);
        } catch (err) {
          console.error(err.message || err.toString());
        }
      });

    fn.command("remove")
      .description("Remove a function directory and update project.yml")
      .argument("<name>", "Function name <package/function> (e.g. user/signup")
      .action(async name => {
        try {
          await removeFunction(process.cwd(), name);
        } catch (err) {
          console.error(err.message || err.toString());
        }
      });

    return fn;
  })()
);

docts.parse(process.argv);
