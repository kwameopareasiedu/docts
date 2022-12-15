import { expect } from "chai";
import { before } from "mocha";
import {
  listFiles,
  polyfillGlobals,
  resetTempDirectory,
  tempDir
} from "../src/utils";
import init from "../src/init";
import { resolve } from "path";

describe("init", function () {
  const projectName = "docts-project";
  const projectPath = resolve(tempDir, projectName);

  before(async () => {
    polyfillGlobals();
    await resetTempDirectory();
  });

  it("should successfully create a functions project", async function () {
    process.chdir(tempDir);

    await init(
      projectName,
      "0.1.0",
      "Test docts project",
      "Kwame Opare Asiedu"
    );

    const listGen = await listFiles(projectPath, [], true);

    let fileCount = 0;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for await (const pathLike of listGen) {
      fileCount += 1;
    }

    expect(fileCount).to.be.equal(12);
  });
});
