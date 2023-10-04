"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const repo_cloc_functions_1 = require("./repo-cloc.functions");
describe('clocOnRepos', () => {
    it(`should return an array of language statistics for each repository of the current folder
    since the current folder has just 1 repo, there will be just 2 items in the array,
    one for this repo and one that is the total`, (done) => {
        const path = '.';
        (0, repo_cloc_functions_1.clocOnRepos)(path).subscribe((stats) => {
            (0, chai_1.expect)(stats instanceof Array).to.be.true;
            (0, chai_1.expect)(stats.length).equal(2);
            // since one stat is for the current repo, the other is the total
            // the 2 stats must have the same values
            const statsForThisRepo = stats[0].clocStats;
            (0, chai_1.expect)(statsForThisRepo instanceof Array).to.be.true;
            (0, chai_1.expect)(statsForThisRepo.length).greaterThan(0);
            (0, chai_1.expect)(!!statsForThisRepo[0].language).to.be.true;
            (0, chai_1.expect)(!!statsForThisRepo[0].nFiles).to.be.true;
            (0, chai_1.expect)(!!statsForThisRepo[0].blank).to.be.true;
            (0, chai_1.expect)(!!statsForThisRepo[0].comment).to.be.true;
            (0, chai_1.expect)(!!statsForThisRepo[0].code).to.be.true;
            const total = stats[1].clocStats;
            (0, chai_1.expect)(total instanceof Array).to.be.true;
            (0, chai_1.expect)(total.length).greaterThan(0);
            (0, chai_1.expect)(!!total[0].language).to.be.true;
            (0, chai_1.expect)(!!total[0].nFiles).to.be.true;
            (0, chai_1.expect)(!!total[0].blank).to.be.true;
            (0, chai_1.expect)(!!total[0].comment).to.be.true;
            (0, chai_1.expect)(!!total[0].code).to.be.true;
            (0, chai_1.expect)(stats[0].repoPath).equal(path);
            (0, chai_1.expect)(stats[1].repoPath).equal(path);
            done();
        });
    }).timeout(100000);
});
//# sourceMappingURL=repo-cloc.functions.spec.js.map