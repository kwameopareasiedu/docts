import { main } from "./main";
import { expect } from "chai";

describe("main.js", function () {
  it("should return a string", function () {
    expect(main()).to.be.equal("Hello World! Let's build an awesome library");
  });
});
