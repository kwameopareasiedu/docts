import { expect } from "chai";
import { before } from "mocha";
import { resetTempDirectory, scanProject, tempDir } from "./utils";
import init from "./init";
import { resolve } from "path";
import createFunction from "./create-function";
import removeFunction from "./remove-function";

describe("create-function.js", function () {
  const projectName = "docts-project";
  const projectPath = resolve(tempDir, projectName);
  const functionPath = "test/fn";

  before(async () => {
    await resetTempDirectory();
  });

  it("should remove a function directory from project", async function () {
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

    await removeFunction(projectPath, functionPath);

    const finalScan = scanProject(projectPath);
    expect(finalScan.functions.existing).to.not.include(functionPath);
  });
});
