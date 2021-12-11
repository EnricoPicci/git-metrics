import { expect } from 'chai';
import path = require('path');
import { tap, concatMap, toArray, map, forkJoin } from 'rxjs';
import { readLinesObs } from 'observable-fs';
import { ConfigReadCommits, ConfigReadMultiReposCommits, ConfigReadTags } from './read-params/read-params';
import {
    readCommitsCommand,
    readCommits,
    readTags,
    readTagsCommand,
    readMultiReposCommits,
    COMMITS_FILE_POSTFIX,
    readBranchesGraphCommand,
    readBranchesGraph,
    readAndStreamCommitsNewProces,
    buildGitOutfile,
    readCommitsNewProcess,
} from './read-git';

import { DEFAUL_CONFIG } from '../0-config/config';
import { deleteFile } from '../0-tools/test-helpers/delete-file';

const SEP = DEFAUL_CONFIG.SEP;

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

describe(`readCommits`, () => {
    const outDir = './temp';
    it(`read the commits from a git repo using git log command and saves them in a file`, (done) => {
        const outFile = 'this-git-repo-commits.log';
        const config: ConfigReadCommits = {
            repoFolderPath: './',
            filter: ['test-data/git-repo-with-code/*.java'],
            after: '2018-01-01',
            outDir,
            outFile,
        };
        const expectedOutFilePath = path.resolve(path.join(outDir, outFile));
        const returnedOutFilePath = readCommits(config);
        expect(returnedOutFilePath).equal(expectedOutFilePath);

        const outFilePath = path.join(process.cwd(), outDir, outFile);

        readLinesObs(outFilePath).subscribe({
            next: (lines) => {
                expect(lines).not.undefined;
                // the filter applied to the read command selects 2 files which have been committed only once and therefore there are 3 lines in the file
                // one line for the commit and one line for each file
                // if we change and commit those files again this test will have to be adjusted
                // we have to use files commited as part of this project to run the test about reading a git repo since we can not save another git repo
                // (for instance a repo to be used only for this test) within another repo, so we are forced to use the project repo as the repo
                // we read from
                expect(lines.length).equal(3);
            },
            error: (err) => done(err),
            complete: () => done(),
        });
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
    it(`read the commits from a git repo and write them on a file running on a different process`, (done) => {
        const outFile = 'this-git-repo-commits-write-only.log';
        const config: ConfigReadCommits = {
            repoFolderPath: process.cwd(),
            filter: ['test-data/git-repo-with-code/*.java'],
            after: '2018-01-01',
            outDir,
            outFile,
        };

        let outFileNotified: string;

        const outGitFile = buildGitOutfile(config);

        readAndStreamCommitsNewProces(config, outGitFile, true)
            .pipe(
                tap({
                    next: (filePath) => {
                        outFileNotified = filePath;
                        expect(filePath).equal(outGitFile);
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
                    // check that actually the outfile has been notified
                    expect(outFileNotified).equal(outGitFile);
                    done();
                },
            });
    });
    it(`read the commits from a git repo using git log command running on a different process - the result should be the same as 
    when running the command that writes the result of git log into a file`, (done) => {
        const outFileNewProces = 'this-git-repo-commits-new-process.log';
        const outFileSameProces = 'this-git-repo-commits-same-process.log';
        const config: ConfigReadCommits = {
            repoFolderPath: process.cwd(),
            after: '2018-01-01',
            outDir,
        };

        const outGitFileNewProces = buildGitOutfile({ ...config, outFile: outFileNewProces });

        readAndStreamCommitsNewProces(config, outGitFileNewProces)
            .pipe(
                toArray(),
                map((linesReadInOtherProces) => {
                    const outFile = readCommits({ ...config, outFile: outFileSameProces });
                    return { linesReadInOtherProces, outFile };
                }),
                concatMap(({ linesReadInOtherProces, outFile }) => {
                    return readLinesObs(outFile).pipe(
                        map((linesReadFromFileSaved) => ({ linesReadInOtherProces, linesReadFromFileSaved })),
                    );
                }),
                tap({
                    next: ({ linesReadInOtherProces, linesReadFromFileSaved }) => {
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
                        expect(linesReadInOtherProces.length).equal(linesReadFromFileSaved.length + 1);
                    },
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(200000);
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
                    const outFile = readCommits({ ...config, outFile: outFileSameProces });
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
                        expect(linesReadInOtherProces.length).equal(linesReadFromFileSaved.length + 1);
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
            filter: ['test-data/git-repo-with-code/*.java'],
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

describe(`readTagsCommand`, () => {
    it(`builds the git log command to read the tags`, () => {
        const outDir = './temp';
        const outFile = 'io-backend-tags.log';
        const config: ConfigReadTags = {
            repoFolderPath: './test-data/io-backend',
            outDir,
            outFile,
        };
        // the command build should be equivalent to this
        // git -C ./test-data/io-backend log --no-walk --tags --pretty="%h %d %s" --decorate=full > ./test-data/output/io-backend-tags.log`;
        const expectedOutfile = path.resolve(path.join(outDir, outFile));
        const expected = `git -C ${config.repoFolderPath} log --no-walk --tags --pretty='${SEP}%h${SEP}%d${SEP}%s' --decorate=full > ${expectedOutfile}`;
        const [cmd, out] = readTagsCommand(config);
        expect(cmd).equal(expected);
        expect(out).equal(expectedOutfile);
    });
    it(`read the tags from a git repo using git log command and saves them in a file`, (done) => {
        const outDir = './temp';
        const outFile = 'io-backend-tags.log';
        const config: ConfigReadTags = {
            repoFolderPath: './',
            outDir,
            outFile,
        };
        const expectedOutFilePath = path.resolve(path.join(outDir, outFile));
        const returnedOutFilePath = readTags(config);
        expect(returnedOutFilePath).equal(expectedOutFilePath);
        const outFilePath = path.join(process.cwd(), outDir, outFile);
        readLinesObs(outFilePath).subscribe({
            next: (lines) => {
                expect(lines).not.undefined;
                // just check that there are some tags since the nuber of tags is not stable, e.g. is incremented any time the package is published
                expect(lines.length).gt(0);
            },
            error: (err) => done(err),
            complete: () => done(),
        });
    });
});

describe(`readMultiReposCommits`, () => {
    it(`read the commits from a git repo using git log command and saves them in a file`, (done) => {
        const outDir = './temp';
        const outFilePrefix = 'multi-repo-analysis-';
        const config: ConfigReadMultiReposCommits = {
            repoFolderPaths: ['./'],
            filter: ['test-data/git-repo-with-code/*.java'],
            after: '2018-01-01',
            outDir,
            outFilePrefix,
        };
        const thisRepoName = 'git-metrics';
        const expectedOutFilePath = path.resolve(
            `${path.join(outDir, outFilePrefix)}${thisRepoName}${COMMITS_FILE_POSTFIX}`,
        );
        readMultiReposCommits(config)
            .pipe(
                tap({
                    next: (returnedOutFilePaths) => {
                        expect(returnedOutFilePaths.length).equal(1);
                        expect(returnedOutFilePaths[0]).equal(expectedOutFilePath);
                    },
                    error: (err) => done(err),
                }),
                concatMap(() => readLinesObs(expectedOutFilePath)),
                tap({
                    next: (lines) => {
                        expect(lines).not.undefined;
                        // the filter applied to the read command selects 2 files which have been committed only once and therefore there are 3 lines in the file
                        // one line for the commit and one line for each file
                        // if we change and commit those files again this test will have to be adjusted
                        // we have to use files commited as part of this project to run the test about reading a git repo since we can not save another git repo
                        // (for instance a repo to be used only for this test) within another repo, so we are forced to use the project repo as the repo
                        // we read from
                        expect(lines.length).equal(3);
                    },
                    error: (err) => done(err),
                    complete: () => done(),
                }),
            )
            .subscribe();
    }).timeout(20000);
    it(`read the commits from two git repos, which happen to be the same, using git log command concurrently and asynchronousl,
    and saves them in a file for each repo`, (done) => {
        const outDir = './temp';
        const outFilePrefix = 'multi-repo-analysis-';
        const config: ConfigReadMultiReposCommits = {
            repoFolderPaths: ['', '.', './'],
            filter: ['test-data/git-repo-with-code/*.java'],
            after: '2018-01-01',
            outDir,
            outFilePrefix,
        };
        const thisRepoName = 'git-metrics';
        const expectedOutFilePath = path.resolve(
            `${path.join(outDir, outFilePrefix)}${thisRepoName}${COMMITS_FILE_POSTFIX}`,
        );
        readMultiReposCommits(config)
            .pipe(
                tap({
                    next: (returnedOutFilePaths) => {
                        expect(returnedOutFilePaths.length).equal(3);
                        expect(returnedOutFilePaths[0]).equal(expectedOutFilePath);
                        expect(returnedOutFilePaths[1]).equal(expectedOutFilePath);
                        expect(returnedOutFilePaths[2]).equal(expectedOutFilePath);
                    },
                    error: (err) => done(err),
                }),
                concatMap(() => readLinesObs(expectedOutFilePath)),
                tap({
                    next: (lines) => {
                        expect(lines).not.undefined;
                        // the filter applied to the read command selects 2 files which have been committed only once and therefore there are 3 lines in the file
                        // one line for the commit and one line for each file
                        // if we change and commit those files again this test will have to be adjusted
                        // we have to use files commited as part of this project to run the test about reading a git repo since we can not save another git repo
                        // (for instance a repo to be used only for this test) within another repo, so we are forced to use the project repo as the repo
                        // we read from
                        expect(lines.length).equal(3);
                    },
                    error: (err) => done(err),
                }),
                concatMap(() => readLinesObs(expectedOutFilePath)),
                tap({
                    next: (lines) => {
                        expect(lines).not.undefined;
                        // the second repo is the same as the first one and therefore the tests are the same
                        expect(lines.length).equal(3);
                    },
                    error: (err) => done(err),
                    complete: () => done(),
                }),
            )
            .subscribe();
    }).timeout(20000);
});

describe(`readBranchesGraph`, () => {
    it(`builds the git log command to read the graph of the branches`, () => {
        const outDir = './temp';
        const outFile = 'io-backend-branches-graph.log';
        const config: ConfigReadTags = {
            repoFolderPath: './test-data/io-backend',
            outDir,
            outFile,
        };
        const expectedOutfile = path.resolve(path.join(outDir, outFile));
        const expected = `git -C ${config.repoFolderPath} log --all --graph --date=short --pretty=medium > ${expectedOutfile}`;
        const [cmd, out] = readBranchesGraphCommand(config);
        expect(cmd).equal(expected);
        expect(out).equal(expectedOutfile);
    });
    it(`read the graphs log from a git repo using git log command and saves them in a file`, (done) => {
        const outDir = './temp';
        const outFile = 'io-backend-tags.log';
        const config: ConfigReadTags = {
            repoFolderPath: './',
            outDir,
            outFile,
        };
        const expectedOutFilePath = path.resolve(path.join(outDir, outFile));
        const returnedOutFilePath = readBranchesGraph(config);
        expect(returnedOutFilePath).equal(expectedOutFilePath);
        const outFilePath = path.join(process.cwd(), outDir, outFile);
        readLinesObs(outFilePath).subscribe({
            next: (lines) => {
                expect(lines).not.undefined;
                // just check that there are some tags since the nuber of tags is not stable, e.g. is incremented any time the package is published
                expect(lines.length).gt(0);
            },
            error: (err) => done(err),
            complete: () => done(),
        });
    });
});
