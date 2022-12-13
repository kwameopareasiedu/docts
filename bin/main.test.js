"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const main_1 = require("./main");
const chai_1 = require("chai");
describe("main.js", function () {
    it("should return a string", function () {
        (0, chai_1.expect)((0, main_1.main)()).to.be.equal("Hello World! Let's build an awesome library");
    });
});
