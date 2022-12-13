import { relative, resolve } from "path";
import { cpSync, existsSync, readdirSync, writeFileSync } from "fs";
import { listFiles } from "./utils";
import { renderFile } from "ejs";

export default async function init(name: string) {
  const projectDir = resolve(process.cwd(), name);
  const templateDir = resolve(__dirname, "../templates/project");
  const destFiles = existsSync(projectDir) ? readdirSync(projectDir) : [];

  if (destFiles.length > 0) {
    return `error: destination '${resolve(projectDir)}' is not empty`;
  }

  const templateFilesGenerator = listFiles(templateDir, []);

  for await (const src of templateFilesGenerator) {
    const relativeSrc = relative(resolve(templateDir), src);
    const dest = resolve(resolve(projectDir), relativeSrc).replaceAll(
      ".ejs",
      ""
    );

    cpSync(src, dest, { recursive: true });

    try {
      const content = await renderFile(src);
      writeFileSync(dest, content);
    } catch (err) {
      console.warn(`warning: ${err.message}'`);
      console.warn(`warning: could not render content to '${dest}'`);
    }

    console.log(`created '${dest}'`);
  }

  console.log(`Scaffolded project in '${projectDir}'!\n`);
  console.log(`1. 'cd ${name}'`);
  console.log("2. 'yarn install' to install dependencies");
  console.log("3. 'yarn dev' to watch files for changes");
  console.log(
    "4. Get started with DigitalOcean functions: https://docs.digitalocean.com/products/functions/"
  );
}