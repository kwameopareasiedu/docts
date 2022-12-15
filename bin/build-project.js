import { relative, resolve } from "path";
import { ensureRootIsValidFunctionsProject, scanProject } from "./utils.js";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { rollup } from "rollup";
import typescript from "@rollup/plugin-typescript";
import { rm } from "fs/promises";
export default async function buildProject(root) {
    ensureRootIsValidFunctionsProject(root);
    const scan = scanProject(root);
    const fns = scan.functions.declared;
    const srcDir = resolve(root, "src");
    const packagesDir = resolve(root, "packages");
    const rootPackageJson = resolve(root, "package.json");
    const rootPackageConfig = JSON.parse(readFileSync(rootPackageJson, { encoding: "utf-8" }));
    // Clear packages dir
    await rm(packagesDir, { recursive: true, force: true });
    for (const fnPath of fns) {
        const fnSrcDir = resolve(srcDir, fnPath);
        const fnPackagesDir = resolve(packagesDir, fnPath);
        const fnSrcIndex = resolve(fnSrcDir, "index.ts");
        if (existsSync(fnSrcIndex)) {
            // Create the fn package dir
            mkdirSync(fnPackagesDir, { recursive: true });
            const build = await rollup({
                input: fnSrcIndex,
                plugins: [
                    typescript({
                        compilerOptions: {
                            module: "esnext"
                        }
                    })
                ]
            });
            const { output: buildOutput } = await build.generate({
                format: "cjs"
            });
            let dependencies = {};
            for (const chunk of buildOutput) {
                if (chunk.type === "chunk") {
                    const dependencyObject = chunk.imports.reduce((imports, _import) => {
                        const version = rootPackageConfig.dependencies[_import];
                        if (version) {
                            return { ...imports, [_import]: version };
                        }
                        else
                            return { ...imports };
                    }, {});
                    dependencies = { ...dependencies, ...dependencyObject };
                    await build.write({
                        file: resolve(fnPackagesDir, "index.js")
                    });
                    break;
                }
            }
            // Generate function packages/**/package.json file
            const packageJson = {
                main: "./index.js",
                type: "module",
                dependencies
            };
            writeFileSync(resolve(fnPackagesDir, "package.json"), JSON.stringify(packageJson, null, 2));
        }
        else {
            console.warn(`skipping '${relative(srcDir, fnSrcDir)}' due to missing package.json!`);
        }
    }
    console.log("\nBuilt 'src' into 'packages' dir. You can deploy with doctl!");
}
