import { expect } from "chai";
import { repoCreationDateDict$ } from "./repo-creation-date";

describe('repoCreationDateDict', () => {
    it('should return a dictionary with repo URLs as keys and creation dates as values', (done) => {
        const filePath = './test-data/repo-creation-date/test-repo-file.csv';
        const aRepoInTheFile = 'https://git.ad.my_my_company.com/abcapp/abcappws.git';
        const aRepoCreationDate = '2018-10-04T08:55:26.921Z';
        const aRepoNotPresentInTheFile = 'https://git.ad.my_my_company.com/blabla/blabla.git';

        repoCreationDateDict$(filePath).subscribe(repoCreationDateDict => {
            expect(repoCreationDateDict[aRepoInTheFile]).to.equal(aRepoCreationDate);
            expect(repoCreationDateDict[aRepoNotPresentInTheFile]).to.be.undefined;
            done();
        })
    });
});