import { expect } from 'chai';
import { clocOnRepos } from './repo-cloc.functions';

describe('clocOnRepos', () => {
    it(`should return an array of language statistics for each repository of the current folder
    since the current folder has just 1 repo, there will be just 2 items in the array,
    one for this repo and one that is the total`, (done) => {
        const path = '.'
        clocOnRepos(path).subscribe((stats) => {
            expect(stats instanceof Array).to.be.true;
            expect(stats.length).equal(2);
            // since one stat is for the current repo, the other is the total
            // the 2 stats must have the same values
            const statsForThisRepo = stats[0].clocStats
            expect(statsForThisRepo instanceof Array).to.be.true;
            expect(statsForThisRepo.length).greaterThan(0);
            expect(!!statsForThisRepo[0].language).to.be.true;
            expect(!!statsForThisRepo[0].nFiles).to.be.true;
            expect(!!statsForThisRepo[0].blank).to.be.true;
            expect(!!statsForThisRepo[0].comment).to.be.true;
            expect(!!statsForThisRepo[0].code).to.be.true;

            const total = stats[1].clocStats
            expect(total instanceof Array).to.be.true;
            expect(total.length).greaterThan(0);
            expect(!!total[0].language).to.be.true;
            expect(!!total[0].nFiles).to.be.true;
            expect(!!total[0].blank).to.be.true;
            expect(!!total[0].comment).to.be.true;
            expect(!!total[0].code).to.be.true;

            expect(stats[0].repoPath).equal(path);
            expect(stats[1].repoPath).equal(path);
            done();
        });
    }).timeout(100000);
});