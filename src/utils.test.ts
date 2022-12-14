import { expect } from "chai";
import { before } from "mocha";
import { resetTempDirectory, tempDir } from "./utils";
import init from "./init";
import { resolve } from "path";
import { scanProject } from "./utils";

describe("utils.js", function () {
  const projectName = "docts-project";
  const projectPath = resolve(tempDir, projectName);

  before(async () => {
    await resetTempDirectory();
  });

  it("should scan a functions project and return a representation", async function () {
    process.chdir(tempDir);

    await init(
      projectName,
      "0.1.0",
      "Test docts project",
      "Kwame Opare Asiedu"
    );

    const scan = scanProject(projectPath);

    expect(scan.functions.declared.length).to.be.equal(1);
    expect(scan.functions.existing.length).to.be.equal(1);
    expect(scan.functions.missing.length).to.be.equal(0);
    expect(scan.functions.undeclared.length).to.be.equal(0);
  });
});
