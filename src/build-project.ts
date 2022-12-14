import { relative, resolve } from "path";
import { NpmProject, scanProject, validateProjectRoot } from "./utils.js";
import dependencyTree from "dependency-tree";
import parseImports from "parse-imports";
import { readFileSync, writeFileSync } from "fs";

export default async function buildProject(root: string) {
  validateProjectRoot(root);

  const scan = scanProject(root);
  const srcDir = resolve(root, "src");
  const fnDirs = scan.functions.existing.map(fnPath => resolve(srcDir, fnPath));

  const rootPackageJson = resolve(root, "package.json");
  const rootPackageConfig = JSON.parse(
    readFileSync(rootPackageJson, { encoding: "utf-8" })
  ) as NpmProject;
  const rootPackageDependencies = rootPackageConfig.dependencies;

  for (const fnDir of fnDirs) {
    const fnIndexFileName = resolve(fnDir, "index.ts");

    const fnDependencyFileNames = dependencyTree.toList({
      filename: fnIndexFileName,
      directory: root,
      noTypeDefinitions: true,
      nodeModulesConfig: {
        entry: "module"
      }
    });

    let fnDependencyImports = {};

    for (const fnDependencyFileName of fnDependencyFileNames) {
      const code = readFileSync(fnDependencyFileName, { encoding: "utf-8" });
      const imports = [
        ...(await parseImports(code, {
          resolveFrom: root
        }))
      ];

      const dependencyImports = imports
        .filter(im => im.moduleSpecifier.type === "package")
        .reduce((imports, im) => {
          const importName = im.moduleSpecifier.value;
          const importVersion = rootPackageDependencies[importName];

          if (importVersion) {
            return { ...imports, [importName]: importVersion };
          } else return { ...imports };
        }, {});

      fnDependencyImports = { ...fnDependencyImports, ...dependencyImports };
    }

    // Write imports to function package.json file
    const fnPackageJson = resolve(fnDir, "package.json");
    const fnPackageConfig = JSON.parse(
      readFileSync(fnPackageJson, { encoding: "utf-8" })
    ) as NpmProject;

    const newFnPackageConfig: NpmProject = {
      ...fnPackageConfig,
      dependencies: fnDependencyImports
    };

    writeFileSync(fnPackageJson, JSON.stringify(newFnPackageConfig, null, 2));

    const dependencyCount = Object.keys(fnDependencyImports).length;
    console.log(
      `updated ${dependencyCount} ${
        dependencyCount === 1 ? "dependency" : "dependencies"
      } in '${relative(srcDir, fnDir)}/package.json'`
    );
  }

  console.log("\nBuilt 'src' into 'packages' dir. You can deploy with doctl!");
}
