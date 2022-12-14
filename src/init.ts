import { relative, resolve } from "path";
import { cpSync, existsSync, readdirSync, writeFileSync } from "fs";
import { listFiles } from "./utils.js";
import { renderFile } from "ejs";

export default async function init(
  name: string,
  version: string,
  description: string,
  author: string
) {
  const projectDir = resolve(process.cwd(), name);
  const templateDir = resolve(__dirname, "../templates/project");
  const existingFiles = existsSync(projectDir) ? readdirSync(projectDir) : [];

  if (existingFiles.length > 0) {
    return console.error(
      `error: destination '${resolve(projectDir)}' is not empty`
    );
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
      const data = { version, description, author };
      const content = await renderFile(src, data);
      writeFileSync(dest, content);
    } catch (err) {
      console.warn(`warning: ${err.message}'`);
      console.warn(`warning: could not render content to '${dest}'`);
    }

    console.log(`created '${dest}'`);
  }

  console.log(`Created project in '${projectDir}'!\n`);
  console.log(`1. 'cd ${name}'`);
  console.log("2. 'yarn install' to install dependencies");
  console.log("3. Create functions in 'src/'");
  console.log(
    "More on DigitalOcean Functions: https://docs.digitalocean.com/products/functions/"
  );
}
