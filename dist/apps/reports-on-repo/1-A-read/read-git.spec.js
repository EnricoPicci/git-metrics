"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const path = require("path");
const rxjs_1 = require("rxjs");
const observable_fs_1 = require("observable-fs");
const read_git_1 = require("./read-git");
const config_1 = require("../0-config/config");
const delete_file_1 = require("../../../tools/test-helpers/delete-file");
const commit_functions_1 = require("../../../git-functions/commit.functions");
const SEP = config_1.DEFAUL_CONFIG.GIT_COMMIT_REC_SEP;
describe(`readCommitsCommand`, () => {
    const outDir = './temp';
    const outFile = 'this-git-repo-commits.log';
    it(`builds the git log command to read the commits`, () => {
        const config = {
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
        const [cmd, out] = (0, read_git_1.readCommitsCommand)(config);
        (0, chai_1.expect)(cmd).equal(expected);
        (0, chai_1.expect)(out).equal(expectedOutfile);
    });
    it(`builds the git log command to read the commits with more than on filter`, () => {
        // the command build should be equivalent to this
        // git -C ./test-data/git-repo log --all --numstat --date=short --pretty=format:'--%h--%ad--%aN' --no-renames --after=2018-01-01 '*.c'  '*.sh' > ./test-data/output/git-repo-commits.log`;
        const config = {
            repoFolderPath: './',
            filter: ['*.c', '*.sh'],
            after: '2018-01-01',
            outDir,
            outFile,
        };
        const expectedOutfile = path.resolve(path.join(outDir, outFile));
        const expected = `git -C ${config.repoFolderPath} log --all --numstat --date=short --pretty=format:${SEP}%h${SEP}%ad${SEP}%aN${SEP}%cN${SEP}%cd${SEP}%f${SEP}%p --after=2018-01-01 '*.c' '*.sh' > ${expectedOutfile}`;
        const [cmd, out] = (0, read_git_1.readCommitsCommand)(config);
        (0, chai_1.expect)(cmd).equal(expected);
        (0, chai_1.expect)(out).equal(expectedOutfile);
    });
    it(`builds the git log command to read the commits after a start date and before an end date`, () => {
        const config = {
            repoFolderPath: './',
            filter: ['*.c', '*.sh'],
            after: '2018-01-01',
            before: '2019-01-01',
            outDir,
            outFile,
        };
        const expectedOutfile = path.resolve(path.join(outDir, outFile));
        const expected = `git -C ${config.repoFolderPath} log --all --numstat --date=short --pretty=format:${SEP}%h${SEP}%ad${SEP}%aN${SEP}%cN${SEP}%cd${SEP}%f${SEP}%p --after=2018-01-01 --before=2019-01-01  '*.c' '*.sh' > ${expectedOutfile}`;
        const [cmd, out] = (0, read_git_1.readCommitsCommand)(config);
        (0, chai_1.expect)(cmd).equal(expected);
        (0, chai_1.expect)(out).equal(expectedOutfile);
    });
    it(`builds the git log command to read the commits with -m and --first-parent options`, () => {
        const config = {
            repoFolderPath: './a-path-to-a-git-repo',
            filter: ['*.txt'],
            outDir,
            outFile,
            includeMergeCommits: true,
            firstParent: true,
        };
        const expectedOutfile = path.resolve(path.join(outDir, outFile));
        const expected = `git -C ${config.repoFolderPath} log --all --numstat --date=short --pretty=format:${SEP}%h${SEP}%ad${SEP}%aN${SEP}%cN${SEP}%cd${SEP}%f${SEP}%p -m --first-parent '*.txt' > ${expectedOutfile}`;
        const [cmd, out] = (0, read_git_1.readCommitsCommand)(config);
        (0, chai_1.expect)(cmd).equal(expected);
        (0, chai_1.expect)(out).equal(expectedOutfile);
    });
});
describe(`readCommitsNewProces`, () => {
    const outDir = './temp';
    it.only(`read the commits from a git repo using git log command running on a different process`, (done) => {
        const outFile = 'this-git-repo-commits.log';
        const config = {
            repoFolderPath: process.cwd(),
            filter: ['test-data/git-repo-with-code/*.java'],
            after: '2018-01-01',
            outDir,
            outFile,
        };
        const outGitFile = (0, read_git_1.buildGitOutfile)(config);
        (0, read_git_1.readAndStreamCommitsNewProces)(config, outGitFile)
            .pipe((0, rxjs_1.tap)({
            next: (data) => {
                (0, chai_1.expect)(data).not.undefined;
            },
        }), (0, rxjs_1.toArray)(), (0, rxjs_1.tap)({
            next: (lines) => {
                (0, chai_1.expect)(lines).not.undefined;
                (0, chai_1.expect)(lines.length).gt(0);
            },
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    });
    it(`read the commits from a git repo and write them on a file running on a different process`, (done) => {
        const outFile = 'this-git-repo-commits-write-only.log';
        const config = {
            repoFolderPath: process.cwd(),
            filter: ['test-data/git-repo-with-code/*.java'],
            after: '2018-01-01',
            outDir,
            outFile,
        };
        let outFileNotified;
        const outGitFile = (0, read_git_1.buildGitOutfile)(config);
        (0, read_git_1.readAndStreamCommitsNewProces)(config, outGitFile, true)
            .pipe((0, rxjs_1.tap)({
            next: (filePath) => {
                outFileNotified = filePath;
                (0, chai_1.expect)(filePath).equal(outGitFile);
            },
        }), (0, rxjs_1.concatMap)((filePath) => (0, observable_fs_1.readLinesObs)(filePath)), (0, rxjs_1.tap)({
            next: (lines) => {
                (0, chai_1.expect)(lines.length).gt(2);
            },
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => {
                // check that actually the outfile has been notified
                (0, chai_1.expect)(outFileNotified).equal(outGitFile);
                done();
            },
        });
    });
    it(`read the commits from a git repo using git log command running on a different process - the result should be the same as 
    when running the command that writes the result of git log into a file`, (done) => {
        const outFileNewProces = 'this-git-repo-commits-new-process.log';
        const outFileSameProces = 'this-git-repo-commits-same-process.log';
        const config = {
            repoFolderPath: process.cwd(),
            after: '2018-01-01',
            outDir,
        };
        const outGitFileNewProces = (0, read_git_1.buildGitOutfile)(Object.assign(Object.assign({}, config), { outFile: outFileNewProces }));
        (0, read_git_1.readAndStreamCommitsNewProces)(config, outGitFileNewProces)
            .pipe((0, rxjs_1.toArray)(), (0, rxjs_1.map)((linesReadInOtherProces) => {
            const outFile = (0, commit_functions_1.writeCommitLog)(Object.assign(Object.assign({}, config), { outFile: outFileSameProces }));
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
                        throw new Error(`Error in line ${i} - ${line} vs ${otherLine}`);
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
    }).timeout(200000);
    it(`read the commits from a git repo using git log command running on a different process - the output of the git log command is saved on a file - 
    this file should have the same content as that of the file saved 
    when running the command that writes syncronously the result of git log into a file`, (done) => {
        const outFileNewProces = 'this-git-repo-commits-new-process-check-file-3.log';
        const outFileSameProces = 'this-git-repo-commits-same-process-check-file-3.log';
        const config = {
            repoFolderPath: process.cwd(),
            after: '2018-01-01',
            outDir,
        };
        const outGitFileNewProces = (0, read_git_1.buildGitOutfile)(Object.assign(Object.assign({}, config), { outFile: outFileNewProces }));
        (0, read_git_1.readAndStreamCommitsNewProces)(config, outGitFileNewProces)
            .pipe((0, rxjs_1.toArray)(), (0, rxjs_1.map)(() => {
            const outFile = (0, commit_functions_1.writeCommitLog)(Object.assign(Object.assign({}, config), { outFile: outFileSameProces }));
            return outFile;
        }), (0, rxjs_1.concatMap)((outFile) => {
            return (0, rxjs_1.forkJoin)([(0, observable_fs_1.readLinesObs)(outGitFileNewProces), (0, observable_fs_1.readLinesObs)(outFile)]);
        }), (0, rxjs_1.tap)({
            next: ([linesReadInOtherProces, linesReadFromFileSaved]) => {
                linesReadFromFileSaved.forEach((line, i) => {
                    if (line !== linesReadInOtherProces[i]) {
                        const otherLine = linesReadInOtherProces[i];
                        console.log(line);
                        console.log(otherLine);
                        throw new Error(`Error in line ${i} - ${line} vs ${otherLine}`);
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
    }).timeout(200000);
});
describe(`readCommitsNewProcess`, () => {
    const outDir = './temp';
    it(`read the commits from a git repo and write them on a file running on a different process`, (done) => {
        const outFile = 'this-git-repo-commits-export-new-process.log';
        const config = {
            repoFolderPath: process.cwd(),
            filter: ['test-data/git-repo-with-code/*.java'],
            after: '2018-01-01',
            outDir,
            outFile,
        };
        let outFileNotified;
        const outGitFile = (0, read_git_1.buildGitOutfile)(config);
        let counter = 0;
        (0, delete_file_1.deleteFile)(outGitFile)
            .pipe((0, rxjs_1.concatMap)(() => (0, read_git_1.readCommitsNewProcess)(config)), (0, rxjs_1.tap)({
            next: (filePath) => {
                outFileNotified = filePath;
                (0, chai_1.expect)(filePath).equal(outGitFile);
                counter++;
            },
        }), (0, rxjs_1.concatMap)((filePath) => (0, observable_fs_1.readLinesObs)(filePath)), (0, rxjs_1.tap)({
            next: (lines) => {
                (0, chai_1.expect)(lines.length).gt(2);
            },
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => {
                // check that actually the outfile has been notifie
                (0, chai_1.expect)(outFileNotified).equal(outGitFile);
                (0, chai_1.expect)(counter).equal(1);
                done();
            },
        });
    });
});
describe(`readTagsCommand`, () => {
    it(`builds the git log command to read the tags`, () => {
        const outDir = './temp';
        const outFile = 'io-backend-tags.log';
        const config = {
            repoFolderPath: './test-data/io-backend',
            outDir,
            outFile,
        };
        // the command build should be equivalent to this
        // git -C ./test-data/io-backend log --no-walk --tags --pretty="%h %d %s" --decorate=full > ./test-data/output/io-backend-tags.log`;
        const expectedOutfile = path.resolve(path.join(outDir, outFile));
        const expected = `git -C ${config.repoFolderPath} log --no-walk --tags --pretty='${SEP}%h${SEP}%d${SEP}%s' --decorate=full > ${expectedOutfile}`;
        const [cmd, out] = (0, read_git_1.readTagsCommand)(config);
        (0, chai_1.expect)(cmd).equal(expected);
        (0, chai_1.expect)(out).equal(expectedOutfile);
    });
    it(`read the tags from a git repo using git log command and saves them in a file`, (done) => {
        const outDir = './temp';
        const outFile = 'io-backend-tags.log';
        const config = {
            repoFolderPath: './',
            outDir,
            outFile,
        };
        const expectedOutFilePath = path.resolve(path.join(outDir, outFile));
        const returnedOutFilePath = (0, read_git_1.readTags)(config);
        (0, chai_1.expect)(returnedOutFilePath).equal(expectedOutFilePath);
        const outFilePath = path.join(process.cwd(), outDir, outFile);
        (0, observable_fs_1.readLinesObs)(outFilePath).subscribe({
            next: (lines) => {
                (0, chai_1.expect)(lines).not.undefined;
                // just check that there are some tags since the nuber of tags is not stable, e.g. is incremented any time the package is published
                (0, chai_1.expect)(lines.length).gt(0);
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
        const config = {
            repoFolderPaths: ['./'],
            filter: ['test-data/git-repo-with-code/*.java'],
            after: '2018-01-01',
            outDir,
            outFilePrefix,
        };
        const thisRepoName = 'git-metrics';
        const expectedOutFilePath = path.resolve(`${path.join(outDir, outFilePrefix)}${thisRepoName}${commit_functions_1.COMMITS_FILE_POSTFIX}`);
        (0, read_git_1.readMultiReposCommits)(config)
            .pipe((0, rxjs_1.tap)({
            next: (returnedOutFilePaths) => {
                (0, chai_1.expect)(returnedOutFilePaths.length).equal(1);
                (0, chai_1.expect)(returnedOutFilePaths[0]).equal(expectedOutFilePath);
            },
            error: (err) => done(err),
        }), (0, rxjs_1.concatMap)(() => (0, observable_fs_1.readLinesObs)(expectedOutFilePath)), (0, rxjs_1.tap)({
            next: (lines) => {
                (0, chai_1.expect)(lines).not.undefined;
                // the filter applied to the read command selects 2 files which have been committed only once and therefore there are 3 lines in the file
                // one line for the commit and one line for each file
                // if we change and commit those files again this test will have to be adjusted
                // we have to use files commited as part of this project to run the test about reading a git repo since we can not save another git repo
                // (for instance a repo to be used only for this test) within another repo, so we are forced to use the project repo as the repo
                // we read from
                (0, chai_1.expect)(lines.length).equal(3);
            },
            error: (err) => done(err),
            complete: () => done(),
        }))
            .subscribe();
    }).timeout(200000);
    it(`read the commits from two git repos, which happen to be the same, using git log command concurrently and asynchronousl,
    and saves them in a file for each repo`, (done) => {
        const outDir = './temp';
        const outFilePrefix = 'multi-repo-analysis-';
        const config = {
            repoFolderPaths: ['', '.', './'],
            filter: ['test-data/git-repo-with-code/*.java'],
            after: '2018-01-01',
            outDir,
            outFilePrefix,
        };
        const thisRepoName = 'git-metrics';
        const expectedOutFilePath = path.resolve(`${path.join(outDir, outFilePrefix)}${thisRepoName}${commit_functions_1.COMMITS_FILE_POSTFIX}`);
        (0, read_git_1.readMultiReposCommits)(config)
            .pipe((0, rxjs_1.tap)({
            next: (returnedOutFilePaths) => {
                (0, chai_1.expect)(returnedOutFilePaths.length).equal(3);
                (0, chai_1.expect)(returnedOutFilePaths[0]).equal(expectedOutFilePath);
                (0, chai_1.expect)(returnedOutFilePaths[1]).equal(expectedOutFilePath);
                (0, chai_1.expect)(returnedOutFilePaths[2]).equal(expectedOutFilePath);
            },
            error: (err) => done(err),
        }), (0, rxjs_1.concatMap)(() => (0, observable_fs_1.readLinesObs)(expectedOutFilePath)), (0, rxjs_1.tap)({
            next: (lines) => {
                (0, chai_1.expect)(lines).not.undefined;
                // the filter applied to the read command selects 2 files which have been committed only once and therefore there are 3 lines in the file
                // one line for the commit and one line for each file
                // if we change and commit those files again this test will have to be adjusted
                // we have to use files commited as part of this project to run the test about reading a git repo since we can not save another git repo
                // (for instance a repo to be used only for this test) within another repo, so we are forced to use the project repo as the repo
                // we read from
                (0, chai_1.expect)(lines.length).equal(3);
            },
            error: (err) => done(err),
        }), (0, rxjs_1.concatMap)(() => (0, observable_fs_1.readLinesObs)(expectedOutFilePath)), (0, rxjs_1.tap)({
            next: (lines) => {
                (0, chai_1.expect)(lines).not.undefined;
                // the second repo is the same as the first one and therefore the tests are the same
                (0, chai_1.expect)(lines.length).equal(3);
            },
            error: (err) => done(err),
            complete: () => done(),
        }))
            .subscribe();
    }).timeout(200000);
});
describe(`readBranchesGraph`, () => {
    it(`builds the git log command to read the graph of the branches`, () => {
        const outDir = './temp';
        const outFile = 'io-backend-branches-graph.log';
        const config = {
            repoFolderPath: './test-data/io-backend',
            outDir,
            outFile,
        };
        const expectedOutfile = path.resolve(path.join(outDir, outFile));
        const expected = `git -C ${config.repoFolderPath} log --all --graph --date=short --pretty=medium > ${expectedOutfile}`;
        const [cmd, out] = (0, read_git_1.readBranchesGraphCommand)(config);
        (0, chai_1.expect)(cmd).equal(expected);
        (0, chai_1.expect)(out).equal(expectedOutfile);
    });
    it(`read the graphs log from a git repo using git log command and saves them in a file`, (done) => {
        const outDir = './temp';
        const outFile = 'io-backend-tags.log';
        const config = {
            repoFolderPath: './',
            outDir,
            outFile,
        };
        const expectedOutFilePath = path.resolve(path.join(outDir, outFile));
        const returnedOutFilePath = (0, read_git_1.readBranchesGraph)(config);
        (0, chai_1.expect)(returnedOutFilePath).equal(expectedOutFilePath);
        const outFilePath = path.join(process.cwd(), outDir, outFile);
        (0, observable_fs_1.readLinesObs)(outFilePath).subscribe({
            next: (lines) => {
                (0, chai_1.expect)(lines).not.undefined;
                // just check that there are some tags since the nuber of tags is not stable, e.g. is incremented any time the package is published
                (0, chai_1.expect)(lines.length).gt(0);
            },
            error: (err) => done(err),
            complete: () => done(),
        });
    });
});
//# sourceMappingURL=read-git.spec.js.map