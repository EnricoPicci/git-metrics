"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const rxjs_1 = require("rxjs");
const observable_fs_1 = require("observable-fs");
const read_git_1 = require("./read-git");
describe.skip(`readCommitsNewProces`, () => {
    const outDir = './temp';
    it(`read the commits from a big git repo using git log command running on a different process - the result should be the same as 
    when running the command that writes the result of git log into a file`, (done) => {
        const outFileNewProces = 'this-git-repo-commits-new-process.log';
        const outFileSameProces = 'this-git-repo-commits-same-process.log';
        const config = {
            repoFolderPath: 'pathToRealWorldGitRepoFolder',
            after: '2018-01-01',
            outDir,
        };
        const outGitFileNewProces = (0, read_git_1.buildGitOutfile)(Object.assign(Object.assign({}, config), { outFile: outFileNewProces }));
        (0, read_git_1.readAndStreamCommitsNewProces)(config, outGitFileNewProces)
            .pipe((0, rxjs_1.toArray)(), (0, rxjs_1.map)((linesReadInOtherProces) => {
            const outFile = (0, read_git_1.readCommits)(Object.assign(Object.assign({}, config), { outFile: outFileSameProces }));
            return { linesReadInOtherProces, outFile };
        }), (0, rxjs_1.concatMap)(({ linesReadInOtherProces, outFile }) => {
            return (0, observable_fs_1.readLinesObs)(outFile).pipe((0, rxjs_1.map)((linesReadFromFileSaved) => ({ linesReadInOtherProces, linesReadFromFileSaved })));
        }), (0, rxjs_1.tap)({
            next: ({ linesReadInOtherProces, linesReadFromFileSaved }) => {
                linesReadFromFileSaved.forEach((line, i) => {
                    if (line !== linesReadInOtherProces[i]) {
                        const otherLine = linesReadInOtherProces[i];
                        console.log(line);
                        console.log(otherLine);
                        throw new Error(`Error in line ${i} - ${line} vs ${linesReadFromFileSaved[i]}`);
                    }
                    (0, chai_1.expect)(line === linesReadInOtherProces[i]).true;
                });
                linesReadFromFileSaved.forEach((line, i) => {
                    (0, chai_1.expect)(line === linesReadInOtherProces[i]).true;
                });
                (0, chai_1.expect)(linesReadInOtherProces.length).equal(linesReadFromFileSaved.length + 1);
            },
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(2000000);
});
//# sourceMappingURL=read-git.spec.skip.js.map