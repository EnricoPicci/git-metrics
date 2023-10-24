import { tap } from "rxjs";
import { diff$, splitDiffs } from "./diff-file";
import { expect } from "chai";

describe('diff$', () => {
    it('should a list of diffs between one commit of this repo and its parent', (done) => {
        const repoPath = './';
        const commit = '068444ab6f767b5b45b06d4383b2cf8c0e451e94';
        const parentCommit = `${commit}^1`;
        diff$(commit, parentCommit, repoPath).pipe(
            tap((diffs) => {
                expect(diffs.length).equal(23);
                // all diffs are NOT copy/rename
                diffs.forEach(diff => {
                    expect(diff.isRenameCopy).equal(false);
                })
            })
        ).subscribe({
            error: (err) => done(err),
            complete: () => done()
        });
    });

    it('should a list just one commit which is a copy/rename', (done) => {
        // Expected output of git diff command in this case
        // '1\t1\t',
        // 'src/config-copy-12.ts',
        // 'src/config-copy.ts'
        const repoPath = './';
        const commit = '3f95ae69844907dcefd1790c7acab3514ef5901a';
        const parentCommit = `${commit}^1`;
        diff$(commit, parentCommit, repoPath).pipe(
            tap((diffs) => {
                expect(diffs.length).equal(1);
                // the only diff is a copy/rename
                const firstDiff = diffs[0];
                expect(firstDiff.linesAdded).equal(1);
                expect(firstDiff.linesDeleted).equal(1);
                expect(firstDiff.filePath).equal('src/config-copy-12.ts');
                expect(firstDiff.preImagePath).equal('src/config-copy.ts');
                expect(firstDiff.isRenameCopy).equal(true);
            })
        ).subscribe({
            error: (err) => done(err),
            complete: () => done()
        });
    });

    it('should a list just one commit which is a copy/rename', (done) => {
        // Expected output of git diff command in this case
        //     '1\t0\tsrc/abc.md',
        //     '0\t0\t',
        //     'src/config-copy-copy-xx.ts',
        //     'src/config-copy-xx.ts',
        //     '0\t15\tsrc/config-copy-yy.ts',
        //     '0\t14\tsrc/git-functions/diff-file.spec.ts',
        //     '4\t9\tsrc/git-functions/diff-file.ts',
        //     '0\t1\tsrc/xyz.md'
        // this represents 6 diffs - the second one is a copy/rename
        const repoPath = './';
        const commit = '4fe2715e3a915cf31c8759a9e499404047fa2104';
        const parentCommit = `${commit}^1`;
        diff$(commit, parentCommit, repoPath).pipe(
            tap((diffs) => {
                expect(diffs.length).equal(6);

                // the first diff is NOT a copy/rename
                const firstDiff = diffs[0];
                expect(firstDiff.linesAdded).equal(1);
                expect(firstDiff.linesDeleted).equal(0);
                expect(firstDiff.filePath).equal('src/abc.md');
                expect(firstDiff.preImagePath).equal('');
                expect(firstDiff.isRenameCopy).equal(false);

                // the second diff is a copy/rename
                const secondDiff = diffs[1];
                expect(secondDiff.linesAdded).equal(0);
                expect(secondDiff.linesDeleted).equal(0);
                expect(secondDiff.filePath).equal('src/config-copy-copy-xx.ts');
                expect(secondDiff.preImagePath).equal('src/config-copy-xx.ts');
                expect(secondDiff.isRenameCopy).equal(true);

                // check the last diff
                const lastDiff = diffs[5];
                expect(lastDiff.linesAdded).equal(0);
                expect(lastDiff.linesDeleted).equal(1);
                expect(lastDiff.filePath).equal('src/xyz.md');
                expect(lastDiff.preImagePath).equal('');
                expect(lastDiff.isRenameCopy).equal(false);
            })
        ).subscribe({
            error: (err) => done(err),
            complete: () => done()
        });
    });
});

describe('splitDiffs', () => {
    it(`should split diffs when the first, the third and the last one are rename/copy - test directly the splitDiff function since it makes it easier to
    test such a case`, () => {
        const tokens = [
            '0\t0\t',
            'src/config-copy-copy-xx.ts',
            'src/config-copy-xx.ts',
            '69\t69\tdist/apps/code-turnover/internals/commit-monthly-pair.functions.spec.js',
            '0\t0\t',
            'src/config-copy-copy-yy.ts',
            'src/config-copy-yy.ts',
            '1\t1\tdist/apps/code-turnover/internals/commit-monthly-pair.functions.spec.js.map',
            '10\t10\tdist/apps/code-turnover/internals/commits-by-month.functions.spec.js',
            '1\t1\tdist/apps/code-turnover/internals/commits-by-month.functions.spec.js.map',
            '25\t25\tdist/apps/code-turnover/internals/repos-with-commits-by-month.functions.spec.js',
            '1\t1\tdist/apps/code-turnover/internals/repos-with-commits-by-month.functions.spec.js.map',
            '2\t0\tdist/cloc-functions/cloc-diff-byfile.model.js',
            '0\t0\t',
            'src/config-copy-copy-zz.ts',
            'src/config-copy-zz.ts',
        ]
        const diffs = splitDiffs(tokens);
        expect(diffs.length).equal(10);
        // the first diff is a copy/rename
        const firstDiff = diffs[0];
        expect(firstDiff.linesAdded).equal(0);
        expect(firstDiff.linesDeleted).equal(0);
        expect(firstDiff.filePath).equal('src/config-copy-copy-xx.ts');
        expect(firstDiff.preImagePath).equal('src/config-copy-xx.ts');
        expect(firstDiff.isRenameCopy).equal(true);
        // the second diff is NOT a copy/rename
        const secondDiff = diffs[1];
        expect(secondDiff.linesAdded).equal(69);
        expect(secondDiff.linesDeleted).equal(69);
        expect(secondDiff.filePath).equal('dist/apps/code-turnover/internals/commit-monthly-pair.functions.spec.js');
        expect(secondDiff.preImagePath).equal('');
        expect(secondDiff.isRenameCopy).equal(false);
        // the third diff is a copy/rename
        const thirdDiff = diffs[2];
        expect(thirdDiff.linesAdded).equal(0);
        expect(thirdDiff.linesDeleted).equal(0);
        expect(thirdDiff.filePath).equal('src/config-copy-copy-yy.ts');
        expect(thirdDiff.preImagePath).equal('src/config-copy-yy.ts');
        expect(thirdDiff.isRenameCopy).equal(true);
        // the last diff is a copy/rename
        const lastDiff = diffs[9];
        expect(lastDiff.linesAdded).equal(0);
        expect(lastDiff.linesDeleted).equal(0);
        expect(lastDiff.filePath).equal('src/config-copy-copy-zz.ts');
        expect(lastDiff.preImagePath).equal('src/config-copy-zz.ts');
        expect(lastDiff.isRenameCopy).equal(true);
    });
});


// const ex_2 = [

// ]