import { expect } from 'chai';
import path = require('path');
import { tap, concatMap, toArray, map, forkJoin } from 'rxjs';
import { readLinesObs } from 'observable-fs';
import { ConfigReadCommits } from './read-params/read-params';
import {
    readCommitsCommand,
    readAndStreamCommitsNewProces,
    buildGitOutfile,
    readCommitsNewProcess,
} from './read-git';

import { DEFAUL_CONFIG } from '../0-config/config';
import { deleteFile } from '../../../tools/test-helpers/delete-file';
import { writeCommitWithFileNumstat } from '../../../git-functions/commit.functions';

const SEP = DEFAUL_CONFIG.GIT_COMMIT_REC_SEP;

describe(`readCommitsCommand`, () => {
    const outDir = './temp';
    const outFile = 'this-git-repo-commits.log';
    it(`builds the git log command to read the commits`, () => {
        const config: ConfigReadCommits = {
            repoFolderPath: './a-path-to-a-git-repo',
            filter: ['*.txt'],
            after: '2018-01-01',
            outDir,
            outFile,
            noRenames: true,
        };
        // the command build should be equivalent to this
        // git -C ./test-data/git-repo log --all --numstat --date=short --pretty=format:'--%h--%ad--%aN' --no-renames --after=2018-01-01 '*.txt' > ./test-data/output/git-repo-commits.log`;
        const expectedOutfile = path.resolve(path.join(outDir, outFile));
        const expected = `git -C ${config.repoFolderPath} log --all --numstat --date=short --pretty=format:${SEP}%h${SEP}%ad${SEP}%aN${SEP}%cN${SEP}%cd${SEP}%f${SEP}%p --no-renames --after=2018-01-01 '*.txt' > ${expectedOutfile}`;
        const [cmd, out] = readCommitsCommand(config);
        expect(cmd).equal(expected);
        expect(out).equal(expectedOutfile);
    });
    it(`builds the git log command to read the commits with more than on filter`, () => {
        // the command build should be equivalent to this
        // git -C ./test-data/git-repo log --all --numstat --date=short --pretty=format:'--%h--%ad--%aN' --no-renames --after=2018-01-01 '*.c'  '*.sh' > ./test-data/output/git-repo-commits.log`;
        const config: ConfigReadCommits = {
            repoFolderPath: './',
            filter: ['*.c', '*.sh'],
            after: '2018-01-01',
            outDir,
            outFile,
        };
        const expectedOutfile = path.resolve(path.join(outDir, outFile));
        const expected = `git -C ${config.repoFolderPath} log --all --numstat --date=short --pretty=format:${SEP}%h${SEP}%ad${SEP}%aN${SEP}%cN${SEP}%cd${SEP}%f${SEP}%p --after=2018-01-01 '*.c' '*.sh' > ${expectedOutfile}`;
        const [cmd, out] = readCommitsCommand(config);
        expect(cmd).equal(expected);
        expect(out).equal(expectedOutfile);
    });
    it(`builds the git log command to read the commits after a start date and before an end date`, () => {
        const config: ConfigReadCommits = {
            repoFolderPath: './',
            filter: ['*.c', '*.sh'],
            after: '2018-01-01',
            before: '2019-01-01',
            outDir,
            outFile,
        };
        const expectedOutfile = path.resolve(path.join(outDir, outFile));
        const expected = `git -C ${config.repoFolderPath} log --all --numstat --date=short --pretty=format:${SEP}%h${SEP}%ad${SEP}%aN${SEP}%cN${SEP}%cd${SEP}%f${SEP}%p --after=2018-01-01 --before=2019-01-01  '*.c' '*.sh' > ${expectedOutfile}`;
        const [cmd, out] = readCommitsCommand(config);
        expect(cmd).equal(expected);
        expect(out).equal(expectedOutfile);
    });
    it(`builds the git log command to read the commits with -m and --first-parent options`, () => {
        const config: ConfigReadCommits = {
            repoFolderPath: './a-path-to-a-git-repo',
            filter: ['*.txt'],
            outDir,
            outFile,
            includeMergeCommits: true,
            firstParent: true,
        };
        const expectedOutfile = path.resolve(path.join(outDir, outFile));
        const expected = `git -C ${config.repoFolderPath} log --all --numstat --date=short --pretty=format:${SEP}%h${SEP}%ad${SEP}%aN${SEP}%cN${SEP}%cd${SEP}%f${SEP}%p -m --first-parent '*.txt' > ${expectedOutfile}`;
        const [cmd, out] = readCommitsCommand(config);
        expect(cmd).equal(expected);
        expect(out).equal(expectedOutfile);
    });
});

describe(`readCommitsNewProces`, () => {
    const outDir = './temp';
    it(`read the commits from a git repo using git log command running on a different process`, (done) => {
        const outFile = 'this-git-repo-commits.log';
        const config: ConfigReadCommits = {
            repoFolderPath: process.cwd(),
            filter: ['test-data/git-repo-with-code/*.java'],
            after: '2018-01-01',
            outDir,
            outFile,
        };

        const outGitFile = buildGitOutfile(config);

        readAndStreamCommitsNewProces(config, outGitFile)
            .pipe(
                tap({
                    next: (data) => {
                        expect(data).not.undefined;
                    },
                }),
                toArray(),
                tap({
                    next: (lines) => {
                        expect(lines).not.undefined;
                        expect(lines.length).gt(0);
                    },
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    });
    it(`read the commits from a git repo using git log command running on a different process - the output of the git log command is saved on a file - 
    this file should have the same content as that of the file saved 
    when running the command that writes syncronously the result of git log into a file`, (done) => {
        const outFileNewProces = 'this-git-repo-commits-new-process-check-file-3.log';
        const outFileSameProces = 'this-git-repo-commits-same-process-check-file-3.log';
        const config: ConfigReadCommits = {
            repoFolderPath: process.cwd(),
            after: '2018-01-01',
            outDir,
        };

        const outGitFileNewProces = buildGitOutfile({ ...config, outFile: outFileNewProces });

        readAndStreamCommitsNewProces(config, outGitFileNewProces)
            .pipe(
                toArray(),
                map(() => {
                    const outFile = writeCommitWithFileNumstat({ ...config, outFile: outFileSameProces });
                    return outFile;
                }),
                concatMap((outFile) => {
                    return forkJoin([readLinesObs(outGitFileNewProces), readLinesObs(outFile)]);
                }),
                tap({
                    next: ([linesReadInOtherProces, linesReadFromFileSaved]) => {
                        linesReadFromFileSaved.forEach((line, i) => {
                            if (line !== linesReadInOtherProces[i]) {
                                const otherLine = linesReadInOtherProces[i];
                                console.log(line);
                                console.log(otherLine);
                                throw new Error(`Error in line ${i} - ${line} vs ${otherLine}`);
                            }
                            expect(line === linesReadInOtherProces[i]).true;
                        });
                        linesReadFromFileSaved.forEach((line, i) => {
                            expect(line === linesReadInOtherProces[i]).true;
                        });
                        expect(linesReadInOtherProces.length).equal(linesReadFromFileSaved.length);
                    },
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(200000);
});

describe(`readCommitsNewProcess`, () => {
    const outDir = './temp';
    it(`read the commits from a git repo and write them on a file running on a different process`, (done) => {
        const outFile = 'this-git-repo-commits-export-new-process.log';
        const config: ConfigReadCommits = {
            repoFolderPath: process.cwd(),
            filter: ['*.json'],
            after: '2018-01-01',
            outDir,
            outFile,
        };

        let outFileNotified: string;

        const outGitFile = buildGitOutfile(config);
        let counter = 0;

        deleteFile(outGitFile)
            .pipe(
                concatMap(() => readCommitsNewProcess(config)),
                tap({
                    next: (filePath) => {
                        outFileNotified = filePath;
                        expect(filePath).equal(outGitFile);
                        counter++;
                    },
                }),
                concatMap((filePath) => readLinesObs(filePath)),
                tap({
                    next: (lines) => {
                        expect(lines.length).gt(2);
                    },
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => {
                    // check that actually the outfile has been notifie
                    expect(outFileNotified).equal(outGitFile);
                    expect(counter).equal(1);
                    done();
                },
            });
    });
});
