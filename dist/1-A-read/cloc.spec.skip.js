"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const path_1 = __importDefault(require("path"));
const cloc_1 = require("./cloc");
describe(`createSummaryClocLog`, () => {
    it(`read the summary view provided by cloc from the folder named as the repo and saves it in a file`, () => {
        const outDir = path_1.default.join(process.cwd(), './temp');
        const config = {
            repoFolderPath: `./`,
            outDir,
        };
        const expectedOutFilePath = path_1.default.join(outDir, `git-metrics-summary-cloc.csv`);
        const returnedOutFilePath = (0, cloc_1.createSummaryClocLog)(config, 'test');
        (0, chai_1.expect)(returnedOutFilePath).equal(expectedOutFilePath);
    }).timeout(20000);
});
//# sourceMappingURL=cloc.spec.skip.js.map