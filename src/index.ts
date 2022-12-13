#!/usr/bin/env node
import { program as docts } from "commander";
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
    await init(name);
  });

docts.parse(process.argv);
