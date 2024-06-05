import { relative, resolve } from "path";
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import {
  DoFunction,
  DoProject,
  functionNameRegex,
  ensureRootIsValidFunctionsProject,
  listFiles,
  scanProject
} from "./utils.js";
import { renderFile } from "ejs";
import { parse, stringify } from "yaml";

export default async function createFunction(root: string, fnPath: string) {
  ensureRootIsValidFunctionsProject(root);

  if (!functionNameRegex.test(fnPath)) {
    throw "error function paths must be in the format 'package/function' (e.g. user/signup)";
  }

  const scan = scanProject(root);

  if (scan.functions.existing.includes(fnPath)) {
    throw `error: function '${fnPath}' already exists in project`;
  }

  const [, pkgName, fnName] = functionNameRegex.exec(fnPath);
  const srcDir = resolve(root, "src");
  const pkgDir = resolve(srcDir, pkgName);
  const fnDir = resolve(pkgDir, fnName);

  if (!existsSync(pkgDir)) {
    mkdirSync(pkgDir);
  }

  const templateDir = resolve(__dirname, "../templates/function");
  const templateFilesGenerator = listFiles(templateDir, []);

  for await (const templateSrc of templateFilesGenerator) {
    const relativeSrc = relative(resolve(templateDir), templateSrc);
    const templateDest = resolve(resolve(fnDir), relativeSrc).replaceAll(
      ".ejs",
      ""
    );

    cpSync(templateSrc, templateDest, { recursive: true });

    try {
      const templateData = { name: fnName };
      const content = await renderFile(templateSrc, templateData);
      writeFileSync(templateDest, content);
    } catch (err) {
      console.warn(`warning: ${err.message}'`);
      console.warn(`warning: could not render content to '${templateDest}'`);
    }

    console.log(`created '${templateDest}'`);
  }

  const projectYml = resolve(root, "project.yml");
  const projectConfig = parse(readFileSync(projectYml, "utf-8")) as DoProject;
  const fnConfigEntry: DoFunction = {
    name: fnName,
    binary: false,
    main: "",
    runtime: "nodejs:18",
    web: true,
    parameters: {},
    environment: {},
    annotations: {},
    limits: {}
  };

  let pkgExists = false;

  for (const pkgConfig of projectConfig.packages) {
    if (pkgConfig.name === pkgName) {
      pkgConfig.functions.push(fnConfigEntry);
      pkgExists = true;
      break;
    }
  }

  if (!pkgExists) {
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
    `1. Update the environment, parameters and annotations for '${fnPath}'`
  );
  console.log(
    `2. Open '${relative(
      root,
      resolve(fnDir, "index.ts")
    )}' to edit your function`
  );
}
