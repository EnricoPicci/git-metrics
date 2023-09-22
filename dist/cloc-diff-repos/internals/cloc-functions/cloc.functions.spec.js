"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const cloc_functions_1 = require("./cloc.functions");
// #copilot - most of the boilerplate of these tests was generated by copilot
describe('runCloc', () => {
    it('should return an array of language statistics', (done) => {
        (0, cloc_functions_1.runCloc)('./src').subscribe((stats) => {
            (0, chai_1.expect)(stats instanceof Array).to.be.true;
            (0, chai_1.expect)(stats.length).greaterThan(0);
            (0, chai_1.expect)(!!stats[0].language).to.be.true;
            (0, chai_1.expect)(!!stats[0].nFiles).to.be.true;
            (0, chai_1.expect)(!!stats[0].blank).to.be.true;
            (0, chai_1.expect)(!!stats[0].comment).to.be.true;
            (0, chai_1.expect)(!!stats[0].code).to.be.true;
            done();
        });
    });
    it('should return statistics for TypeScript files', (done) => {
        (0, cloc_functions_1.runCloc)('./src').subscribe((stats) => {
            const typescriptStats = stats.find((stat) => stat.language === 'TypeScript');
            (0, chai_1.expect)(!!typescriptStats).to.be.true;
            (0, chai_1.expect)(typescriptStats.nFiles).greaterThan(0);
            (0, chai_1.expect)(typescriptStats.blank).greaterThan(0);
            (0, chai_1.expect)(typescriptStats.comment).greaterThan(0);
            (0, chai_1.expect)(typescriptStats.code).greaterThan(0);
            done();
        });
    });
    it('should return statistics reading from a git repo commit - the commit is from the repo of this project', (done) => {
        (0, cloc_functions_1.runCloc)('cf36b3fcc51b81482a3a5af5c531c5158b46d42c').subscribe((stats) => {
            const typescriptStats = stats.find((stat) => stat.language === 'TypeScript');
            (0, chai_1.expect)(!!typescriptStats).to.be.true;
            (0, chai_1.expect)(typescriptStats.nFiles).greaterThan(0);
            (0, chai_1.expect)(typescriptStats.blank).greaterThan(0);
            (0, chai_1.expect)(typescriptStats.comment).greaterThan(0);
            (0, chai_1.expect)(typescriptStats.code).greaterThan(0);
            done();
        });
    });
});
//# sourceMappingURL=cloc.functions.spec.js.map