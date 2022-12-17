import { relative, resolve } from "path";
import { ensureRootIsValidFunctionsProject, scanProject } from "./utils.js";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { rollup } from "rollup";
import typescript from "@rollup/plugin-typescript";
import { rm } from "fs/promises";
import nodeResolve from "@rollup/plugin-node-resolve";
import commonJs from "@rollup/plugin-commonjs";
/**
 * @param root The project root path
 * @param includedPackages A list of packages to include in the bundle
 * instead of marking them as external
 */
export default async function buildProject(root, includedPackages = []) {
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
            const plugins = [
                typescript({
                    compilerOptions: {
                        module: "esnext"
                    }
                })
            ];
            // If packages are to be included in build,
            // include the @rollup/plugin-node-resolve
            // and @rollup/plugin-commonjs plugins
            if (includedPackages.length > 0) {
                plugins.push(nodeResolve({
                    resolveOnly: includedPackages
                }), commonJs());
            }
            const build = await rollup({
                input: fnSrcIndex,
                plugins
            });
            const { output: buildOutput } = await build.generate({});
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
