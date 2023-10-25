"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rxjs_1 = require("rxjs");
const diff_file_1 = require("./diff-file");
const chai_1 = require("chai");
describe('diff$', () => {
    it('should build a stream of diffs between one commit of this repo and its parent', (done) => {
        const repoPath = './';
        const commit = '068444ab6f767b5b45b06d4383b2cf8c0e451e94';
        const parentCommit = `${commit}^1`;
        (0, diff_file_1.diff$)(commit, parentCommit, repoPath).pipe((0, rxjs_1.tap)((diffs) => {
            (0, chai_1.expect)(diffs.length).equal(23);
            // all diffs are NOT copy/rename
            diffs.forEach(diff => {
                (0, chai_1.expect)(diff.isRenameCopy).equal(false);
            });
        })).subscribe({
            error: (err) => done(err),
            complete: () => done()
        });
    });
    it('should build a stream that notifies just one value which is a copy/rename type of diff', (done) => {
        // Expected output of git diff command in this case
        // '1\t1\t',
        // 'src/config-copy-12.ts',
        // 'src/config-copy.ts'
        const repoPath = './';
        const commit = '3f95ae69844907dcefd1790c7acab3514ef5901a';
        const parentCommit = `${commit}^1`;
        (0, diff_file_1.diff$)(commit, parentCommit, repoPath).pipe((0, rxjs_1.tap)((diffs) => {
            (0, chai_1.expect)(diffs.length).equal(1);
            // the only diff is a copy/rename
            const firstDiff = diffs[0];
            (0, chai_1.expect)(firstDiff.linesAdded).equal(1);
            (0, chai_1.expect)(firstDiff.linesDeleted).equal(1);
            (0, chai_1.expect)(firstDiff.filePath).equal('src/config-copy-12.ts');
            (0, chai_1.expect)(firstDiff.preImagePath).equal('src/config-copy.ts');
            (0, chai_1.expect)(firstDiff.isRenameCopy).equal(true);
        })).subscribe({
            error: (err) => done(err),
            complete: () => done()
        });
    });
    it('should build a stream that notifies a mix of copy/rename and non copy/renama diffs', (done) => {
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
        (0, diff_file_1.diff$)(commit, parentCommit, repoPath).pipe((0, rxjs_1.tap)((diffs) => {
            (0, chai_1.expect)(diffs.length).equal(6);
            // the first diff is NOT a copy/rename
            const firstDiff = diffs[0];
            (0, chai_1.expect)(firstDiff.linesAdded).equal(1);
            (0, chai_1.expect)(firstDiff.linesDeleted).equal(0);
            (0, chai_1.expect)(firstDiff.filePath).equal('src/abc.md');
            (0, chai_1.expect)(firstDiff.preImagePath).equal('');
            (0, chai_1.expect)(firstDiff.isRenameCopy).equal(false);
            // the second diff is a copy/rename
            const secondDiff = diffs[1];
            (0, chai_1.expect)(secondDiff.linesAdded).equal(0);
            (0, chai_1.expect)(secondDiff.linesDeleted).equal(0);
            (0, chai_1.expect)(secondDiff.filePath).equal('src/config-copy-copy-xx.ts');
            (0, chai_1.expect)(secondDiff.preImagePath).equal('src/config-copy-xx.ts');
            (0, chai_1.expect)(secondDiff.isRenameCopy).equal(true);
            // check the last diff
            const lastDiff = diffs[5];
            (0, chai_1.expect)(lastDiff.linesAdded).equal(0);
            (0, chai_1.expect)(lastDiff.linesDeleted).equal(1);
            (0, chai_1.expect)(lastDiff.filePath).equal('src/xyz.md');
            (0, chai_1.expect)(lastDiff.preImagePath).equal('');
            (0, chai_1.expect)(lastDiff.isRenameCopy).equal(false);
        })).subscribe({
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
        ];
        const diffs = (0, diff_file_1.splitDiffs)(tokens);
        (0, chai_1.expect)(diffs.length).equal(10);
        // the first diff is a copy/rename
        const firstDiff = diffs[0];
        (0, chai_1.expect)(firstDiff.linesAdded).equal(0);
        (0, chai_1.expect)(firstDiff.linesDeleted).equal(0);
        (0, chai_1.expect)(firstDiff.filePath).equal('src/config-copy-copy-xx.ts');
        (0, chai_1.expect)(firstDiff.preImagePath).equal('src/config-copy-xx.ts');
        (0, chai_1.expect)(firstDiff.isRenameCopy).equal(true);
        // the second diff is NOT a copy/rename
        const secondDiff = diffs[1];
        (0, chai_1.expect)(secondDiff.linesAdded).equal(69);
        (0, chai_1.expect)(secondDiff.linesDeleted).equal(69);
        (0, chai_1.expect)(secondDiff.filePath).equal('dist/apps/code-turnover/internals/commit-monthly-pair.functions.spec.js');
        (0, chai_1.expect)(secondDiff.preImagePath).equal('');
        (0, chai_1.expect)(secondDiff.isRenameCopy).equal(false);
        // the third diff is a copy/rename
        const thirdDiff = diffs[2];
        (0, chai_1.expect)(thirdDiff.linesAdded).equal(0);
        (0, chai_1.expect)(thirdDiff.linesDeleted).equal(0);
        (0, chai_1.expect)(thirdDiff.filePath).equal('src/config-copy-copy-yy.ts');
        (0, chai_1.expect)(thirdDiff.preImagePath).equal('src/config-copy-yy.ts');
        (0, chai_1.expect)(thirdDiff.isRenameCopy).equal(true);
        // the last diff is a copy/rename
        const lastDiff = diffs[9];
        (0, chai_1.expect)(lastDiff.linesAdded).equal(0);
        (0, chai_1.expect)(lastDiff.linesDeleted).equal(0);
        (0, chai_1.expect)(lastDiff.filePath).equal('src/config-copy-copy-zz.ts');
        (0, chai_1.expect)(lastDiff.preImagePath).equal('src/config-copy-zz.ts');
        (0, chai_1.expect)(lastDiff.isRenameCopy).equal(true);
    });
});
describe('copyRenamesDict$', () => {
    it(`should build a stream that notifies a dictionary with 2 entries, one for the filePath and one for the preImagePath
    of the only one diff which is a rename/copy`, (done) => {
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
        const expectedFilePath = 'src/config-copy-copy-xx.ts';
        const expectedPreImagePath = 'src/config-copy-xx.ts';
        (0, diff_file_1.copyRenamesDict$)(commit, parentCommit, repoPath).pipe((0, rxjs_1.tap)((diffsDict) => {
            (0, chai_1.expect)(Object.keys(diffsDict).length).equal(2);
            (0, chai_1.expect)(diffsDict[expectedFilePath].filePath).equal(expectedFilePath);
            (0, chai_1.expect)(diffsDict[expectedFilePath].preImagePath).equal(expectedPreImagePath);
        })).subscribe({
            error: (err) => done(err),
            complete: () => done()
        });
    });
});
//# sourceMappingURL=diff-file.spec.js.map