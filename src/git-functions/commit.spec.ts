import { expect } from 'chai';
import { SEP, commitAtDateOrAfter$, commitAtDateOrBefore$, commitClosestToDate$, diffBetweenCommits$, countCommits$, newCommitCompactFromGitlog, readCommitCompact$, readCommitCompactWithUrlAndParentDate$, readCommitWithFileNumstat$, readOneCommitCompact$, writeCommitWithFileNumstat, writeCommitWithFileNumstat$, writeCommitWithFileNumstatCommand } from './commit';
import { ERROR_UNKNOWN_REVISION_OR_PATH } from './errors';
import { EMPTY, catchError, concat, concatMap, forkJoin, last, tap, toArray } from 'rxjs';
import { GitLogCommitParams } from './git-params';
import path from 'path';
import { readLinesObs } from 'observable-fs';
import { CommitWithFileNumstats } from './commit.model';
import { deleteFile } from '../tools/test-helpers/delete-file';
import { CONFIG } from '../config';
import { toYYYYMMDD } from '../tools/dates/date-functions';

describe('readCommitCompact$', () => {
    it('should throw an error if repoPath is not provided', () => {
        expect(() => readCommitCompact$('')).to.throw()
    });

    it('should return a stream of commit objects from this repo', (done) => {
        readCommitCompact$('./').pipe(
            toArray()
        ).subscribe((commits) => {
            expect(commits instanceof Array).to.be.true;
            expect(commits.length).greaterThan(0);
            const firstCommit = commits[commits.length - 1];
            expect(firstCommit.sha).equal('8767d5864e7d72df0f25915fe8e0652244eee5fa');
            expect(!!firstCommit.date).to.be.true;
            expect(!!firstCommit.author).to.be.true;
            expect(!!firstCommit.subject).to.be.true;

            // this tests that the sha is a real sha and not something else
            const lastCommit = commits[0];
            expect(lastCommit.sha.includes(' ')).to.be.false;
            done();
        });
    });
});

describe('readOneCommitCompact$', () => {
    it('should throw an error if an not existing sha is provided', (done) => {
        const notExistingCommitSha = 'abc'
        const repoPath = './'
        readOneCommitCompact$(notExistingCommitSha, repoPath, undefined, false).subscribe({
            next: () => {
                done('should not return a value')
            },
            error: (error) => {
                expect(error).equal(ERROR_UNKNOWN_REVISION_OR_PATH);
                done();
            },
            complete: () => {
                done('should not complete')
            }
        });
    });

    it('should notify the first commit object of this repo', (done) => {
        const firstCommitOfThisRepo = '8767d5864e7d72df0f25915fe8e0652244eee5fa'
        const repoPath = './'
        readOneCommitCompact$(firstCommitOfThisRepo, repoPath, undefined, false).subscribe({
            next: (commitCompact) => {
                expect(commitCompact.sha).equal(firstCommitOfThisRepo);
                done();
            },
            error: (error) => {
                done(error);
            },
        });
    });
});

describe(`writeCommitLog`, () => {
    const outDir = './temp';
    it(`read the commits from a git repo using git log command and saves them in a file`, (done) => {
        const outFile = 'this-git-repo-commits.log';
        const config: GitLogCommitParams = {
            repoFolderPath: './',
            filter: ['test-data/git-repo-with-code/*.java'],
            after: '2018-01-01',
            outDir,
            outFile,
        };
        const expectedOutFilePath = path.resolve(path.join(outDir, outFile));
        const returnedOutFilePath = writeCommitWithFileNumstat(config);
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

describe(`readCommitWithFileNumstatFromLog$`, () => {
    const outDir = './temp';
    it(`read the commits from a git repo and notifies them over a stream`, (done) => {
        const outFile = 'this-git-repo-commits.log';
        const params: GitLogCommitParams = {
            repoFolderPath: process.cwd(),
            filter: ['./*.md'],
            after: '2018-01-01',
            outDir,
            outFile,
        };

        const outFilePath = path.join(process.cwd(), outDir, outFile);

        readCommitWithFileNumstat$(params, outFilePath)
            .pipe(
                tap({
                    next: (data: CommitWithFileNumstats) => {
                        expect(data).not.undefined;
                    },
                }),
                toArray(),
                tap({
                    next: (commits: CommitWithFileNumstats[]) => {
                        expect(commits).not.undefined;
                        expect(commits.length).gt(0);

                        // we take the third oldest commit since it has all fields with defined values, even the lines added
                        // and lines deleted fields in the files data
                        // we need to reverse since commits are sorted from the newest to the oldest
                        const thirdCommit = commits.reverse()[2];
                        // all fields should be defined hence we test them with the negation operator expectedto return false
                        // in this way we test the undefined case and the null case and the empty string case and the 0 case
                        expect(!thirdCommit.authorDate).to.be.false;
                        expect(!thirdCommit.authorName).to.be.false;
                        expect(!thirdCommit.hashShort).to.be.false;
                        expect(!thirdCommit.files).to.be.false;
                        expect(thirdCommit.files.length).gt(0);
                        const firstFile = thirdCommit.files[0];
                        expect(!firstFile.linesAdded).to.be.false;
                        expect(!firstFile.linesDeleted).to.be.false;
                        expect(!firstFile.path).to.be.false;
                    },
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    });
    it(`read the commits from a git repo and write them on a file`, (done) => {
        const outFile = 'this-git-repo-commits-write-only.log';
        const params: GitLogCommitParams = {
            repoFolderPath: process.cwd(),
            filter: ['./*.md'],
            after: '2018-01-01',
            outDir,
            outFile,
        };

        const outFilePath = path.join(process.cwd(), outDir, outFile);

        let _lines: string[] = []
        readCommitWithFileNumstat$(params, outFilePath)
            .pipe(
                concatMap(() => readLinesObs(outFilePath)),
                tap({
                    next: (lines) => {
                        _lines = lines;
                    },
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => {
                    // we do the check in the complete function so that the test fails even when there are no
                    // commit lines written in the output file
                    expect(_lines.length).gt(0);
                    done();
                },
            });
    });
    it(`read the commits from a git repo but, if there are no commits, then nothing is notified
    and no file is written`, (done) => {
        // we use the current timestamp to name the file so that we are sure that the file does not exist
        const outFile = Date.now() + '-file-not-to-be-written.log';
        const params: GitLogCommitParams = {
            repoFolderPath: process.cwd(),
            filter: ['./*.no-files-with-this-extension'],
            after: '2018-01-01',
            outDir,
            outFile,
        };

        const outFilePath = path.join(process.cwd(), outDir, outFile);

        let _commit: CommitWithFileNumstats;
        let _lines: string[] = []

        const notifyCommits$ = readCommitWithFileNumstat$(params, outFilePath)
            .pipe(
                tap({
                    next: (commit) => {
                        _commit = commit;
                    },
                }),
            )
        const readCommitFileLog$ = readLinesObs(outFilePath).pipe(
            catchError((err) => {
                if (err.code === 'ENOENT') {
                    // emit something so that the next operation can continue
                    return EMPTY;
                }
                throw new Error(err);
            }),
            tap({
                next: (lines) => {
                    _lines = lines;
                },
            }),
        )

        concat(notifyCommits$, readCommitFileLog$)
            .subscribe({
                error: (err) => done(err),
                complete: () => {
                    // we do the check in the complete function that no commit has been notified and
                    // no line has been written in the file
                    expect(_lines.length).equal(0);
                    expect(_commit).undefined;
                    done();
                },
            });
    });

    it(`read the commits from a git repo using git log command - the output of the git log command is saved on a file - 
    this file should have the same content as that of the file saved 
    when executing the "writeCommitLog" function`, (done) => {
        const outFile = 'this-git-repo-commits-new-process-check-file-3.log';
        const params: GitLogCommitParams = {
            repoFolderPath: process.cwd(),
            after: '2018-01-01',
            outDir,
        };

        // here we write the commit log synchronously on the fileWrittenSync file
        const fileWrittenSync = writeCommitWithFileNumstat(params);

        const outFilePath = path.join(process.cwd(), outDir, outFile);
        // here we ask to stream the commits as well as write them on the file outFilePath
        // if life is good, the file outFilePath should have the same content as the file fileWrittenSync
        readCommitWithFileNumstat$(params, outFilePath)
            .pipe(
                // take the last notification so that we are sure that the stream has completed before reading the file
                // which has been produced as part of the execution of the readCommitWithFileNumstatFromLog$ function
                last(),
                concatMap(() => {
                    // read in parallel the file written syncronously and the file written as part of the execution
                    // of the readCommitWithFileNumstatFromLog$ function
                    return forkJoin([readLinesObs(fileWrittenSync), readLinesObs(outFilePath)]);
                }),
                tap({
                    next: ([linesFromFileWrittenSync, linesReadFromFileSaved]) => {
                        expect(linesFromFileWrittenSync.length).equal(linesReadFromFileSaved.length);

                        linesReadFromFileSaved.forEach((line, i) => {
                            if (line !== linesFromFileWrittenSync[i]) {
                                const otherLine = linesFromFileWrittenSync[i];
                                console.log(line);
                                console.log(otherLine);
                                throw new Error(`Error in line ${i} - ${line} vs ${otherLine}`);
                            }
                            expect(line === linesFromFileWrittenSync[i]).true;
                        });
                    },
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(200000);
});

describe(`readCommitsCommand`, () => {
    const outDir = './temp';
    const outFile = 'this-git-repo-commits.log';
    it(`builds the git log command to read the commits`, () => {
        const config: GitLogCommitParams = {
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
        const [cmd, out] = writeCommitWithFileNumstatCommand(config);
        expect(cmd).equal(expected);
        expect(out).equal(expectedOutfile);
    });
    it(`builds the git log command to read the commits with more than on filter`, () => {
        // the command build should be equivalent to this
        // git -C ./test-data/git-repo log --all --numstat --date=short --pretty=format:'--%h--%ad--%aN' --no-renames --after=2018-01-01 '*.c'  '*.sh' > ./test-data/output/git-repo-commits.log`;
        const config: GitLogCommitParams = {
            repoFolderPath: './',
            filter: ['*.c', '*.sh'],
            after: '2018-01-01',
            outDir,
            outFile,
        };
        const expectedOutfile = path.resolve(path.join(outDir, outFile));
        const expected = `git -C ${config.repoFolderPath} log --all --numstat --date=short --pretty=format:${SEP}%h${SEP}%ad${SEP}%aN${SEP}%cN${SEP}%cd${SEP}%f${SEP}%p --after=2018-01-01 '*.c' '*.sh' > ${expectedOutfile}`;
        const [cmd, out] = writeCommitWithFileNumstatCommand(config);
        expect(cmd).equal(expected);
        expect(out).equal(expectedOutfile);
    });
    it(`builds the git log command to read the commits after a start date and before an end date`, () => {
        const config: GitLogCommitParams = {
            repoFolderPath: './',
            filter: ['*.c', '*.sh'],
            after: '2018-01-01',
            before: '2019-01-01',
            outDir,
            outFile,
        };
        const expectedOutfile = path.resolve(path.join(outDir, outFile));
        const expected = `git -C ${config.repoFolderPath} log --all --numstat --date=short --pretty=format:${SEP}%h${SEP}%ad${SEP}%aN${SEP}%cN${SEP}%cd${SEP}%f${SEP}%p --after=2018-01-01 --before=2019-01-01  '*.c' '*.sh' > ${expectedOutfile}`;
        const [cmd, out] = writeCommitWithFileNumstatCommand(config);
        expect(cmd).equal(expected);
        expect(out).equal(expectedOutfile);
    });
    it(`builds the git log command to read the commits with -m and --first-parent options`, () => {
        const config: GitLogCommitParams = {
            repoFolderPath: './a-path-to-a-git-repo',
            filter: ['*.txt'],
            outDir,
            outFile,
            includeMergeCommits: true,
            firstParent: true,
        };
        const expectedOutfile = path.resolve(path.join(outDir, outFile));
        const expected = `git -C ${config.repoFolderPath} log --all --numstat --date=short --pretty=format:${SEP}%h${SEP}%ad${SEP}%aN${SEP}%cN${SEP}%cd${SEP}%f${SEP}%p -m --first-parent '*.txt' > ${expectedOutfile}`;
        const [cmd, out] = writeCommitWithFileNumstatCommand(config);
        expect(cmd).equal(expected);
        expect(out).equal(expectedOutfile);
    });
});

describe(`writeCommitWithFileNumstat$`, () => {
    const outDir = './temp';
    it(`read the commits from a git repo and write them on a file running on a different process`, (done) => {
        const outFile = 'this-git-repo-commits-export-new-process.log';
        const params: GitLogCommitParams = {
            repoFolderPath: process.cwd(),
            filter: ['*.json'],
            after: '2018-01-01',
            outDir,
            outFile,
        };

        let outFileNotified: string;

        const [_, outGitFile] = writeCommitWithFileNumstatCommand(params);
        let counter = 0;

        deleteFile(outGitFile)
            .pipe(
                concatMap(() => writeCommitWithFileNumstat$(params)),
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

describe(`newCommitCompactFromGitlog`, () => {
    it(`create a new CommitCompact from a line of the Git log and check that the comment does not contain csv separators`, () => {
        const gitLogLine = '../../repo-folder,2023-02,2/9/2023,2/8/2023,MY-APP-12, prepare folders, and app-demo,https://git/my-git/-/commit/123xyz,123xyz,added,java,code,0'
        const commit = newCommitCompactFromGitlog(gitLogLine, 'a repo')
        const comment = commit.subject
        expect(comment.includes(CONFIG.CSV_SEP)).false;
        expect(comment.includes(CONFIG.CVS_SEP_SUBSTITUE)).true;
    });
});

describe('readCommitCompactWithParentDate$', () => {
    it('should throw an error if repoPath is not provided', () => {
        expect(() => readCommitCompactWithUrlAndParentDate$('')).to.throw()
    });

    it('should return a stream of commit objects from this repo with the commit objects containing the parent date', (done) => {
        readCommitCompactWithUrlAndParentDate$('./').pipe(
            toArray()
        ).subscribe((commits) => {
            expect(commits instanceof Array).to.be.true;
            expect(commits.length).greaterThan(0);
            // aSpecificCommit is a commit whose parent has a specific date to test (the date is immutable in the repo)
            const aSpecificCommit = commits.find((commit) => commit.sha === 'ef7cf168d4744f2a2e0898ad6184a9a3d538e770');
            if (!aSpecificCommit) {
                throw new Error('aSpecificCommit is undefined');
            }
            expect(toYYYYMMDD(aSpecificCommit.parentDate)).equal(toYYYYMMDD(new Date('2023-10-12')));
            done();
        });
    }).timeout(20000);
});

describe(`commitAtDateOrBefore$`, () => {
    it(`it should notify the sha of the only commit found at a specific date.
    We use the repo of this project to find a specific commit at a specific date`, (done) => {
        const thisRepoPath = './' // the repo of this project
        const date = new Date('2023-11-10')
        const branchName = 'main'

        commitAtDateOrBefore$(thisRepoPath, date, branchName).subscribe({
            next: ([sha]) => {
                expect(sha).equal('109853555729d84e7920a96fde0c2c3257b21cb3');
            },
            error: (err) => done(err),
            complete: () => done(),
        });
    });

    it(`it should notify the sha of the first commit found before a specific date, since at that date there are no commits.
    We use the repo of this project to find a specific commit at a specific date`, (done) => {
        const thisRepoPath = './' // the repo of this project
        const date = new Date('2023-11-12')  // there is no commit at this date
        const branchName = 'main'

        commitAtDateOrBefore$(thisRepoPath, date, branchName).subscribe({
            next: ([sha]) => {
                expect(sha).equal('109853555729d84e7920a96fde0c2c3257b21cb3');
            },
            error: (err) => done(err),
            complete: () => done(),
        });
    });

    it(`it should error since there are no commits at the date or before it.
    We use the repo of this project to find a specific commit at a specific date`, (done) => {
        const thisRepoPath = './' // the repo of this project
        const date = new Date('2012-11-12')  // there is no commit at this date
        const branchName = 'main'

        commitAtDateOrBefore$(thisRepoPath, date, branchName).subscribe({
            next: ([sha]) => {
                expect(sha).equal('')
            },
            error: (err) => done(err),
            complete: () => done(),
        });
    });
});

describe('commitAtDateOrAfter$', () => {
    it(`test the case when there is a commit at the date specified`, (done) => {
        const repoPath = './';
        const branch = 'main';
        const date = new Date('2021-12-11');

        commitAtDateOrAfter$(repoPath, date, branch).subscribe(([sha, commitDate]) => {
            // sometimes sha is 274b760e7a5e871dfd13993bdb08b936b6314299 sometime is 9369eb39af383a2894362d0008b7380d8cf454dd
            // both commits are at the same date
            expect(sha).equals('9369eb39af383a2894362d0008b7380d8cf454dd');
            expect(commitDate).equal('2021-12-13 18:18:05 +0100');
            done();
        });
    });
    it(`test the case when there is a commit after the date passed as parameter`, (done) => {
        const repoPath = './';
        const branch = 'main';
        const date = new Date('2021-12-15');

        commitAtDateOrAfter$(repoPath, date, branch).subscribe(([sha, commitDate]) => {
            expect(sha).equal('64c4b3cd31532d8aa5954c3943cc320ade784ea9');
            expect(commitDate).equal('2023-03-22 17:58:44 +0100');
            done();
        });
    });
    it(`it should error since there is no commit at the date and after it`, (done) => {
        const repoPath = './';
        const branch = 'main';
        // tomorrow is a date in the future
        const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

        commitAtDateOrAfter$(repoPath, tomorrow, branch).subscribe({
            next: ([sha]) => {
                expect(sha).equal('')
            },
            error: (err) => {
                done(err)
            },
            complete: () => done(),
        });
    });
});

describe('commitClosestToDate$', () => {
    it(`test the case when there is a commit at the date specified`, (done) => {
        const repoPath = './';
        const branch = 'main';
        const date = new Date('2021-12-11');

        commitClosestToDate$(repoPath, date, branch).subscribe(([sha, commitDate]) => {
            // sometimes sha is 274b760e7a5e871dfd13993bdb08b936b6314299 sometime is 189adaa55ccb905a7b2f01797457d3caa16a5630
            // both commits are at the same date
            expect(sha === '274b760e7a5e871dfd13993bdb08b936b6314299' || sha === '189adaa55ccb905a7b2f01797457d3caa16a5630').true;
            expect(commitDate === '2021-12-11 12:01:52 +0100' || commitDate === '2021-12-11 11:04:28 +0100').true;
            done();
        });
    });
    it(`test the case when the closest commit is before the date passed as parameter`, (done) => {
        const repoPath = './';
        const branch = 'main';
        const date = new Date('2021-12-15');
        const beforeWhenEqual = false;

        commitClosestToDate$(repoPath, date, branch, beforeWhenEqual).subscribe(([sha, commitDate]) => {
            expect(sha).equal('f812f7b466442d1c83124ee0cecbaa315e372266');
            expect(commitDate).equal('2021-12-13 18:24:33 +0100');
            done();
        });
    });
    it(`test the case when the closest commit is after the date passed as parameter`, (done) => {
        const repoPath = './';
        const branch = 'main';
        const date = new Date('2023-03-01');
        const beforeWhenEqual = false;

        commitClosestToDate$(repoPath, date, branch, beforeWhenEqual).subscribe(([sha, commitDate]) => {
            expect(sha).equal('64c4b3cd31532d8aa5954c3943cc320ade784ea9');
            expect(commitDate).equal('2023-03-22 17:58:44 +0100');
            done();
        });
    });
});

describe('countCommits$', () => {
    it('should return the number of commits using the repo of this project', (done) => {
        const repoPaths = ['./'];
        const fromDate = new Date('2021-01-01');
        const toDate = new Date('2021-12-31');

        countCommits$(repoPaths, fromDate, toDate).subscribe((count) => {
            expect(count).gt(0);
            done();
        });
    });

    it(`if a creationDate csv file is passed which does contain the url of the repo of this project, the creation date 
    is used as start date`, (done) => {
        const repoPaths = ['./'];
        const fromDate = new Date('2021-01-01');
        const toDate = new Date(Date.now());
        const creationDateFilePath = './test-data/repo-creation-date/this-repo-creation-date.csv'

        countCommits$(repoPaths, fromDate, toDate, creationDateFilePath).subscribe((count) => {
            expect(count).gt(0);
            done();
        });
    });

    it(`if a creationDate csv file is passed which does NOT contain the url of the repo of this project, the fromDate parameter is used`, (done) => {
        const repoPaths = ['./'];
        const fromDate = new Date('2021-01-01');
        const toDate = new Date(Date.now());
        const thisRepoCreationDateCsvFile = './test-data/repo-creation-date/this-repo-creation-date.csv'
        const anotherRepoCreationDateCsvFile = './test-data/repo-creation-date/test-repo-file.csv'  // this file does not contain the url of the repo of this project

        const count_1$ = countCommits$(repoPaths, fromDate, toDate, thisRepoCreationDateCsvFile)
        const count_2$ = countCommits$(repoPaths, fromDate, toDate, anotherRepoCreationDateCsvFile)

        forkJoin([count_1$, count_2$]).subscribe(([count_1, count_2]) => {
            expect(count_1).gt(0);
            expect(count_2).gt(0);
            // the count of commits using the creation date of this repo should be smaller than the count of commits using no creation date 
            // if we use a creationDate csv file which does not contain the url of this repo, the creation date is ignored and the fromDate is used
            // and in this example the fromDate is 2021-01-01 which is before the creation date of this repo
            expect(count_1).lt(count_2);
            done();
        });
    });

    it(`if a creationDate csv file is passed which does contain the url of the repo of this project and a creation date which is 
    before the toDate date, then no commit is read since the fromDate (i.e. the creation date) is after the toDate`, (done) => {
        const repoPaths = ['./'];
        const fromDate = new Date(0);
        const toDate = new Date('2021-01-01'); // this date is before the creation date of this repo
        const creationDateFilePath = './test-data/repo-creation-date/this-repo-creation-date.csv'

        countCommits$(repoPaths, fromDate, toDate, creationDateFilePath).subscribe((count) => {
            expect(count).equal(0);
            done();
        });
    });
});

describe(`diffBetweenCommits$`, () => {
    it(`returns diffs between 2 commits`, (done) => {
        const mostRecentCommit = 'v3.1.1';
        const leastRecentCommit = 'v2.1.1';
        diffBetweenCommits$(mostRecentCommit, leastRecentCommit).pipe(
            toArray(),
            tap((ret) => {
                expect(ret).not.undefined;
                expect(ret instanceof Array).true;
                expect(ret.length).gt(0);
            }),
        ).subscribe({
            error: (err) => done(err),
            complete: () => done()
        });
    }).timeout(20000);
});

