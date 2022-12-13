#!/usr/bin/env node
import { program as docts } from "commander";

docts
  .name("docts")
  .description(
    "docts adds dev features for working with Typescript serverless functions using DigitalOcean doctl"
  )
  .version("0.1.0");
