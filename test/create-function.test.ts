import { expect } from "chai";
import { before } from "mocha";
import {
  polyfillGlobals,
  resetTempDirectory,
  scanProject,
  tempDir
} from "../src/utils";
import init from "../src/init";
import { resolve } from "path";
import createFunction from "../src/create-function";

describe("create-function", function () {
  const projectName = "docts-project";
  const projectPath = resolve(tempDir, projectName);
  const functionPath = "test/fn";

  before(async () => {
    polyfillGlobals();
    await resetTempDirectory();
  });

  it("should create a function directory in project", async function () {
    process.chdir(tempDir);

    await init(
      projectName,
      "0.1.0",
      "Test docts project",
      "Kwame Opare Asiedu"
    );

    const preScan = scanProject(projectPath);
    expect(preScan.functions.existing).to.not.include(functionPath);

    await createFunction(projectPath, functionPath);

    const postScan = scanProject(projectPath);
    expect(postScan.functions.existing).to.include(functionPath);
  });
});
