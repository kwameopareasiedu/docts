#!/usr/bin/env node
import { Command, program as docts } from "commander";
import inquirer from "inquirer";
import init from "./init.js";
import createFunction from "./create-function.js";
import { polyfillGlobals, scanProject } from "./utils.js";
import removeFunction from "./remove-function.js";
import buildProject from "./build-project.js";

polyfillGlobals();

docts
  .name("docts")
  .description(
    "Enhances the development experience of DigitalOcean 'doctl serverless' when working with Typescript function projects"
  )
  .version("0.1.0");

docts
  .command("init")
  .description("Initialize a new Typescript doctl function project")
  .argument("<name>", "Project name")
  .action(async name => {
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
      ])) as any;

      await init(name, answers.version, answers.description, answers.author);
    } catch (err) {
      console.error(err.message || err.toString());
    }
  });

docts
  .command("scan")
  .description("Scan a project and return a map of packages and functions")
  .action(() => {
    try {
      const scan = scanProject(process.cwd());

      if (scan.functions.missing.length > 0) {
        console.error("error: project.yml declares missing functions:");
        scan.functions.missing.forEach(pkg => console.error(`- ${pkg}`));
        console.error(
          "remove missing functions from project.yml or create them"
        );
        return;
      }

      console.dir(scan, { depth: null });
    } catch (err) {
      console.error(err.message || err.toString());
    }
  });

docts.addCommand(
  (() => {
    const fn = new Command("fn");

    fn.description("Manage functions in project");

    fn.command("new")
      .description("Create a new function and update project.yml")
      .argument("<name>", "Function name (e.g. user/signup)")
      .action(async name => {
        try {
          await createFunction(process.cwd(), name);
        } catch (err) {
          console.error(err.message || err.toString());
        }
      });

    fn.command("remove")
      .description("Remove a function/package and update project.yml")
      .argument(
        "<name>",
        "Function name (e.g. user/signup) or package name (e.g. user)"
      )
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

docts
  .command("build")
  .description("Builds a project 'src' into 'packages' for deployment")
  .action(async () => {
    try {
      await buildProject(process.cwd());
    } catch (err) {
      console.error(err.message || err.toString());
    }
  });

docts.parse(process.argv);
