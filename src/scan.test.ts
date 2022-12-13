import { expect } from "chai";
import { before } from "mocha";
import { resetTempDirectory, tempDir } from "./utils";
import init from "./init";
import { resolve } from "path";
import scan from "./scan";

describe("scan.js", function () {
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

    const fns = scan(projectPath);

    expect(fns.declared.length).to.be.equal(1);
    expect(fns.existing.length).to.be.equal(1);
    expect(fns.missing.length).to.be.equal(0);
    expect(fns.undeclared.length).to.be.equal(0);
  });
});
