import { relative, resolve } from "path";
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import {
  DoFunction,
  DoProject,
  isValidFunctionsProject,
  listFiles,
  scanProject
} from "./utils";
import { renderFile } from "ejs";
import { parse, stringify } from "yaml";

const nameRegex = RegExp("^(\\w[\\w|-]+)\\/(\\w[\\w|-]+)$");

export default async function createFunction(root: string, name: string) {
  const validityErrors = isValidFunctionsProject(root);
  if (validityErrors) throw validityErrors;

  if (!nameRegex.test(name)) {
    throw "error function names must be in the format 'package/function' (e.g. user/signup)";
  }

  const projectFns = scanProject(root);

  if (projectFns.existing.includes(name)) {
    throw `error: function '${name}' already exists in project`;
  }

  const [, pkgName, fnName] = nameRegex.exec(name);
  const srcDir = resolve(root, "src");
  const pkgDir = resolve(srcDir, pkgName);
  const fnDir = resolve(pkgDir, fnName);

  if (!existsSync(pkgDir)) {
    mkdirSync(pkgDir);
  }

  const templateDir = resolve(__dirname, "../templates/function");
  const templateFilesGenerator = listFiles(templateDir, []);

  for await (const src of templateFilesGenerator) {
    const relativeSrc = relative(resolve(templateDir), src);
    const dest = resolve(resolve(fnDir), relativeSrc).replaceAll(".ejs", "");

    cpSync(src, dest, { recursive: true });

    const data = { name: fnName };

    try {
      const content = await renderFile(src, data);
      writeFileSync(dest, content);
    } catch (err) {
      console.warn(`warning: ${err.message}'`);
      console.warn(`warning: could not render content to '${dest}'`);
    }

    console.log(`created '${dest}'`);
  }

  const projectYml = resolve(root, "project.yml");
  const projectConfig = parse(readFileSync(projectYml, "utf-8")) as DoProject;
  const fnConfigEntry: DoFunction = {
    name: fnName,
    binary: false,
    main: "",
    runtime: "nodejs:default",
    web: true,
    parameters: {},
    environment: {},
    annotations: {},
    limits: {}
  };

  let packageExists = false;

  for (const doPkg of projectConfig.packages) {
    if (doPkg.name === pkgName) {
      doPkg.functions.push(fnConfigEntry);
      packageExists = true;
      break;
    }
  }

  if (!packageExists) {
    projectConfig.packages.push({
      name: pkgName,
      parameters: {},
      environment: {},
      annotations: {},
      functions: [fnConfigEntry]
    });
  }

  writeFileSync(projectYml, stringify(projectConfig));

  console.log(`Created function in '${relative(root, fnDir)}'!\n`);
  console.log(
    `1. Update the environment, parameters and annotations for '${name}'`
  );
  console.log(
    `2. Open '${relative(
      root,
      resolve(fnDir, "index.ts")
    )}' to edit your function`
  );
}
