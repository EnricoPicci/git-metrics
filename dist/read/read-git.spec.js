"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const path = require("path");
const rxjs_1 = require("rxjs");
const observable_fs_1 = require("observable-fs");
const read_git_1 = require("./read-git");
describe(`readCommitsCommand`, () => {
    const outDir = './test-data/output';
    const outFile = 'this-git-repo-commits.log';
    it(`builds the git log command to read the commits`, () => {
        const config = {
            repoFolderPath: './a-path-to-a-git-repo',
            filter: ['*.txt'],
            after: '2018-01-01',
            outDir,
            outFile,
        };
        // the command build should be equivalent to this
        // git -C ./test-data/git-repo log --all --numstat --date=short --pretty=format:'--%h--%ad--%aN' --no-renames --after=2018-01-01 '*.txt' > ./test-data/output/git-repo-commits.log`;
        const expectedOutfile = path.join(outDir, outFile);
        const expected = `git -C ${config.repoFolderPath} log --all --numstat --date=short --pretty=format:'${read_git_1.SEP}%h${read_git_1.SEP}%ad${read_git_1.SEP}%aN${read_git_1.SEP}%cN${read_git_1.SEP}%cd${read_git_1.SEP}%s' --no-renames --after=2018-01-01 '*.txt' > ${expectedOutfile}`;
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
        const expectedOutfile = path.join(outDir, outFile);
        const expected = `git -C ${config.repoFolderPath} log --all --numstat --date=short --pretty=format:'${read_git_1.SEP}%h${read_git_1.SEP}%ad${read_git_1.SEP}%aN${read_git_1.SEP}%cN${read_git_1.SEP}%cd${read_git_1.SEP}%s' --no-renames --after=2018-01-01 '*.c' '*.sh' > ${expectedOutfile}`;
        const [cmd, out] = (0, read_git_1.readCommitsCommand)(config);
        (0, chai_1.expect)(cmd).equal(expected);
        (0, chai_1.expect)(out).equal(expectedOutfile);
    });
    it(`read the commits from a git repo using git log command and saves them in a file`, (done) => {
        const config = {
            repoFolderPath: './',
            filter: ['test-data/git-repo-with-code/*.java'],
            after: '2018-01-01',
            outDir,
            outFile,
        };
        const expectedOutFilePath = path.join(outDir, outFile);
        const returnedOutFilePath = (0, read_git_1.readCommits)(config);
        (0, chai_1.expect)(returnedOutFilePath).equal(expectedOutFilePath);
        const outFilePath = path.join(process.cwd(), outDir, outFile);
        (0, observable_fs_1.readLinesObs)(outFilePath).subscribe({
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
        });
    });
});
describe(`readTagsCommand`, () => {
    it(`builds the git log command to read the tags`, () => {
        const outDir = './test-data/output';
        const outFile = 'io-backend-tags.log';
        const config = {
            repoFolderPath: './test-data/io-backend',
            outDir,
            outFile,
        };
        // the command build should be equivalent to this
        // git -C ./test-data/io-backend log --no-walk --tags --pretty="%h %d %s" --decorate=full > ./test-data/output/io-backend-tags.log`;
        const expectedOutfile = path.join(outDir, outFile);
        const expected = `git -C ${config.repoFolderPath} log --no-walk --tags --pretty='${read_git_1.SEP}%h${read_git_1.SEP}%d${read_git_1.SEP}%s' --decorate=full > ${expectedOutfile}`;
        const [cmd, out] = (0, read_git_1.readTagsCommand)(config);
        (0, chai_1.expect)(cmd).equal(expected);
        (0, chai_1.expect)(out).equal(expectedOutfile);
    });
    it(`read the tags from a git repo using git log command and saves them in a file`, (done) => {
        const outDir = './test-data/output';
        const outFile = 'io-backend-tags.log';
        const config = {
            repoFolderPath: './',
            outDir,
            outFile,
        };
        const expectedOutFilePath = path.join(outDir, outFile);
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
            repoFolderPaths: [''],
            filter: ['test-data/git-repo-with-code/*.java'],
            after: '2018-01-01',
            outDir,
            outFilePrefix,
        };
        const thisRepoName = 'git-metrics';
        const expectedOutFilePath = `${path.join(outDir, outFilePrefix)}${thisRepoName}${read_git_1.COMMITS_FILE_POSTFIX}`;
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
    }).timeout(20000);
    it(`read the commits from two git repos, which happen to be the same, using git log command concurrently and asynchronousl,
    and saves them in a file for each repo`, (done) => {
        const outDir = './temp';
        const outFilePrefix = 'multi-repo-analysis-';
        const config = {
            repoFolderPaths: ['', './'],
            filter: ['test-data/git-repo-with-code/*.java'],
            after: '2018-01-01',
            outDir,
            outFilePrefix,
        };
        const thisRepoName = 'git-metrics';
        const firstExpectedOutFilePath = `${path.join(outDir, outFilePrefix)}${thisRepoName}${read_git_1.COMMITS_FILE_POSTFIX}`;
        const secondExpectedOutFilePath = `temp/multi-repo-analysis-.${read_git_1.COMMITS_FILE_POSTFIX}`;
        (0, read_git_1.readMultiReposCommits)(config)
            .pipe((0, rxjs_1.tap)({
            next: (returnedOutFilePaths) => {
                (0, chai_1.expect)(returnedOutFilePaths.length).equal(2);
                (0, chai_1.expect)(returnedOutFilePaths[0]).equal(firstExpectedOutFilePath);
                (0, chai_1.expect)(returnedOutFilePaths[1]).equal(secondExpectedOutFilePath);
            },
            error: (err) => done(err),
        }), (0, rxjs_1.concatMap)(() => (0, observable_fs_1.readLinesObs)(firstExpectedOutFilePath)), (0, rxjs_1.tap)({
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
        }), (0, rxjs_1.concatMap)(() => (0, observable_fs_1.readLinesObs)(secondExpectedOutFilePath)), (0, rxjs_1.tap)({
            next: (lines) => {
                (0, chai_1.expect)(lines).not.undefined;
                // the second repo is the same as the first one and therefore the tests are the same
                (0, chai_1.expect)(lines.length).equal(3);
            },
            error: (err) => done(err),
            complete: () => done(),
        }))
            .subscribe();
    }).timeout(20000);
});
//# sourceMappingURL=read-git.spec.js.map