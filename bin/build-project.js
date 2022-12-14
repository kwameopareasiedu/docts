import { relative, resolve } from "path";
import { ensureRootIsValidFunctionsProject, scanProject } from "./utils.js";
import dependencyTree from "dependency-tree";
import parseImports from "parse-imports";
import { cpSync, readFileSync, writeFileSync } from "fs";
export default async function buildProject(root) {
    ensureRootIsValidFunctionsProject(root);
    const scan = scanProject(root);
    const fns = scan.functions.existing;
    const srcDir = resolve(root, "src");
    const packagesDir = resolve(root, "packages");
    const rootPackageJson = resolve(root, "package.json");
    const rootPackageConfig = JSON.parse(readFileSync(rootPackageJson, { encoding: "utf-8" }));
    // Build dependency tree of function dirs
    for (const fnPath of fns) {
        const fnSrcDir = resolve(srcDir, fnPath);
        const fnPackageDir = resolve(packagesDir, fnPath);
        const fnIndex = resolve(fnSrcDir, "index.ts");
        const fnDependencyPaths = dependencyTree.toList({
            filename: fnIndex,
            directory: root,
            noTypeDefinitions: true,
            nodeModulesConfig: {
                entry: "module"
            }
        });
        let fnDependencies = {};
        // For each function dependency, determine the package imports used
        // and resolve the versions against the project's root package.json
        for (const fnDependencyPath of fnDependencyPaths) {
            const imports = [
                ...(await parseImports(readFileSync(fnDependencyPath, { encoding: "utf-8" }), { resolveFrom: root }))
            ];
            const dependencies = imports
                .filter(im => im.moduleSpecifier.type === "package")
                .reduce((imports, im) => {
                const importName = im.moduleSpecifier.value;
                const importVersion = rootPackageConfig.dependencies[importName];
                if (importVersion) {
                    return { ...imports, [importName]: importVersion };
                }
                else
                    return { ...imports };
            }, {});
            fnDependencies = { ...fnDependencies, ...dependencies };
        }
        // Write function dependencies to its package.json file
        const fnPackageJson = resolve(fnSrcDir, "package.json");
        const fnPackageConfig = JSON.parse(readFileSync(fnPackageJson, { encoding: "utf-8" }));
        const newFnPackageConfig = {
            ...fnPackageConfig,
            dependencies: fnDependencies
        };
        writeFileSync(fnPackageJson, JSON.stringify(newFnPackageConfig, null, 2));
        // Copy 'src/<fnDir>/package.json' to 'packages/<fnDir>/package.json'
        cpSync(fnPackageJson, resolve(fnPackageDir, "package.json"));
        const dependencyCount = Object.keys(fnDependencies).length;
        console.log(`updated ${dependencyCount} ${dependencyCount === 1 ? "dependency" : "dependencies"} in '${relative(srcDir, fnSrcDir)}/package.json'`);
    }
    console.log("\nBuilt 'src' into 'packages' dir. You can deploy with doctl!");
}
