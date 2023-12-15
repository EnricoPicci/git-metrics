"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const repo_creation_date_1 = require("./repo-creation-date");
describe('repoCreationDateDict', () => {
    it('should return a dictionary with repo URLs as keys and creation dates as values', (done) => {
        const filePath = './test-data/repo-creation-date/test-repo-file.csv';
        const aRepoInTheFile = 'https://git.ad.my_my_company.com/abcapp/abcappws.git';
        const aRepoCreationDate = '2018-10-04T08:55:26.921Z';
        const aRepoNotPresentInTheFile = 'https://git.ad.my_my_company.com/blabla/blabla.git';
        (0, repo_creation_date_1.repoCreationDateDict$)(filePath).subscribe(repoCreationDateDict => {
            (0, chai_1.expect)(repoCreationDateDict[aRepoInTheFile]).to.equal(aRepoCreationDate);
            (0, chai_1.expect)(repoCreationDateDict[aRepoNotPresentInTheFile]).to.be.undefined;
            done();
        });
    });
});
//# sourceMappingURL=repo-ceation-date.spec.js.map