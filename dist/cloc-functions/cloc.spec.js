"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const cloc_1 = require("./cloc");
const path_1 = __importDefault(require("path"));
const delete_file_1 = require("../tools/test-helpers/delete-file");
const rxjs_1 = require("rxjs");
const observable_fs_1 = require("observable-fs");
// #copilot - most of the boilerplate of these tests was generated by copilot
describe('clocSummary$', () => {
    it('should return an array of language statistics', (done) => {
        (0, cloc_1.clocSummary$)('./src').subscribe((stats) => {
            (0, chai_1.expect)(stats instanceof Array).to.be.true;
            (0, chai_1.expect)(stats.length).greaterThan(0);
            (0, chai_1.expect)(!!stats[0].language).to.be.true;
            (0, chai_1.expect)(stats[0].nFiles).greaterThan(0);
            (0, chai_1.expect)(stats[0].blank).greaterThan(0);
            (0, chai_1.expect)(stats[0].comment).greaterThan(0);
            (0, chai_1.expect)(stats[0].code).greaterThan(0);
            done();
        });
    }).timeout(10000);
    it('should return statistics for TypeScript files', (done) => {
        (0, cloc_1.clocSummary$)('./src').subscribe((stats) => {
            const typescriptStats = stats.find((stat) => stat.language === 'TypeScript');
            (0, chai_1.expect)(!!typescriptStats).to.be.true;
            (0, chai_1.expect)(typescriptStats.nFiles).greaterThan(0);
            (0, chai_1.expect)(typescriptStats.blank).greaterThan(0);
            (0, chai_1.expect)(typescriptStats.comment).greaterThan(0);
            (0, chai_1.expect)(typescriptStats.code).greaterThan(0);
            done();
        });
    }).timeout(10000);
    it('should return statistics reading from a git repo commit - the commit is from the repo of this project', (done) => {
        (0, cloc_1.clocSummary$)('2c6f2ae87b539590f5a0f93682f5440ca845bc9c').subscribe((stats) => {
            const typescriptStats = stats.find((stat) => stat.language === 'TypeScript');
            (0, chai_1.expect)(!!typescriptStats).to.be.true;
            (0, chai_1.expect)(typescriptStats.nFiles).greaterThan(0);
            (0, chai_1.expect)(typescriptStats.blank).greaterThan(0);
            (0, chai_1.expect)(typescriptStats.comment).greaterThan(0);
            (0, chai_1.expect)(typescriptStats.code).greaterThan(0);
            done();
        });
    }).timeout(10000);
});
describe('buildOutfileName', () => {
    const thisFolderName = 'git-metrics';
    it('should return the provided output file name if it is provided', () => {
        const outFile = 'output.txt';
        const result = (0, cloc_1.buildOutfileName)(outFile);
        (0, chai_1.expect)(result).to.equal(outFile);
    });
    it('should generate an output file name based on the provided parameters', () => {
        const prefix = 'prefix_';
        const repoFolder = '/path/to/repo';
        const postfix = '_postfix';
        const expected = `${prefix}repo${postfix}`;
        const result = (0, cloc_1.buildOutfileName)('', repoFolder, prefix, postfix);
        (0, chai_1.expect)(result).to.equal(expected);
    });
    it('should use the current working directory name as the base folder name since repo folder is not passed as param', () => {
        const prefix = 'prefix_';
        const postfix = '_postfix';
        const expected = `${prefix}${thisFolderName}${postfix}`;
        const result = (0, cloc_1.buildOutfileName)('', '', prefix, postfix);
        (0, chai_1.expect)(result).to.equal(expected);
    });
    it('should use an empty string as the prefix if prefix is not provided', () => {
        const repoFolder = '/path/to/repo';
        const postfix = '_postfix';
        const expected = `repo${postfix}`;
        const result = (0, cloc_1.buildOutfileName)('', repoFolder, undefined, postfix);
        (0, chai_1.expect)(result).to.equal(expected);
    });
    it('should use an empty string as the postfix if postfix is not provided', () => {
        const prefix = 'prefix_';
        const repoFolder = '/path/to/repo';
        const expected = `${prefix}repo`;
        const result = (0, cloc_1.buildOutfileName)('', repoFolder, prefix, undefined);
        (0, chai_1.expect)(result).to.equal(expected);
    });
    it('should use the current working directory name as the base folder name if repoFolder is "."', () => {
        const prefix = 'prefix_';
        const postfix = '_postfix';
        const expected = `${prefix}${thisFolderName}${postfix}`;
        const result = (0, cloc_1.buildOutfileName)('', '.', prefix, postfix);
        (0, chai_1.expect)(result).to.equal(expected);
    });
    it('should use the current working directory name as the base folder name if repoFolder is "."', () => {
        const prefix = 'prefix_';
        const postfix = '_postfix';
        const expected = `${prefix}${thisFolderName}${postfix}`;
        const result = (0, cloc_1.buildOutfileName)('', './', prefix, postfix);
        (0, chai_1.expect)(result).to.equal(expected);
    });
    it('should use the current working directory name as the base folder name if repoFolder is an empty string', () => {
        const prefix = 'prefix_';
        const postfix = '_postfix';
        const expected = `${prefix}${thisFolderName}${postfix}`;
        const result = (0, cloc_1.buildOutfileName)('', '', prefix, postfix);
        (0, chai_1.expect)(result).to.equal(expected);
    });
});
describe(`writeClocByFile$`, () => {
    it(`read the number of lines for each file from the folder named as the repo and saves them in a file - works in a new process`, (done) => {
        const repo = 'git-repo-with-code';
        const outDir = path_1.default.join(process.cwd(), './temp');
        const outClocFilePrefix = 'new-process';
        const config = {
            folderPath: `./test-data/${repo}`,
            outDir,
            outClocFilePrefix,
            vcs: '',
        };
        const expectedOutFilePath = outDir + '/' + outClocFilePrefix + repo + '-cloc-byfile.csv';
        let counter = 0;
        (0, delete_file_1.deleteFile)(expectedOutFilePath)
            .pipe((0, rxjs_1.concatMap)(() => (0, cloc_1.writeClocByFile$)(config, 'test')), (0, rxjs_1.tap)({
            next: (returnedOutFilePath) => {
                (0, chai_1.expect)(returnedOutFilePath).equal(expectedOutFilePath);
                counter++;
            },
        }), (0, rxjs_1.concatMap)((returnedOutFilePath) => (0, observable_fs_1.readLinesObs)(returnedOutFilePath)), (0, rxjs_1.tap)({
            next: (lines) => {
                (0, chai_1.expect)(lines).not.undefined;
                // there are 5 lines: 3 for the 3 files and 1 for the csv header, which is the first, and one for the sum which is the last
                (0, chai_1.expect)(lines.length).equal(5);
                const _fileName = './hallo.java';
                const [language, filename, blank, comment, code] = lines
                    .find((l) => l.includes(_fileName))
                    .split(',');
                (0, chai_1.expect)(language).equal('Java');
                (0, chai_1.expect)(filename).equal(`${_fileName}`);
                (0, chai_1.expect)(parseInt(blank)).equal(3);
                (0, chai_1.expect)(parseInt(comment)).equal(1);
                (0, chai_1.expect)(parseInt(code)).equal(5);
            },
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => {
                (0, chai_1.expect)(counter).equal(1);
                done();
            },
        });
    }).timeout(200000);
});
describe(`writeClocSummary`, () => {
    it(`read the summary view provided by cloc from the folder named as the repo and saves it in a file`, (done) => {
        const repo = 'git-repo-with-code';
        const outDir = path_1.default.join(process.cwd(), './temp');
        const config = {
            folderPath: `./test-data/${repo}`,
            outDir,
            vcs: '',
        };
        const expectedOutFilePath = path_1.default.join(outDir, `${repo}-cloc-summary.csv`);
        const returnedOutFilePath = (0, cloc_1.writeClocSummary)(config, 'test');
        (0, chai_1.expect)(returnedOutFilePath).equal(expectedOutFilePath);
        (0, observable_fs_1.readLinesObs)(returnedOutFilePath).subscribe({
            next: (lines) => {
                (0, chai_1.expect)(lines).not.undefined;
                // there are 4 lines: 2 for the 2 languages (java nd python) and 1 for the csv header, which is the first,
                // and one for the sum which is the last
                (0, chai_1.expect)(lines.length).equal(4);
                const _language = 'Java';
                const [files, language, blank, comment, code] = lines.find((l) => l.includes(_language)).split(',');
                (0, chai_1.expect)(language).equal('Java');
                (0, chai_1.expect)(parseInt(files)).equal(2);
                (0, chai_1.expect)(parseInt(blank)).equal(3);
                (0, chai_1.expect)(parseInt(comment)).equal(3);
                (0, chai_1.expect)(parseInt(code)).equal(10);
            },
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(200000);
});
describe(`clocSummary$`, () => {
    it(`read the cloc summary and notifies each line containing stats for a language over a stream`, (done) => {
        const repo = 'git-repo-with-code';
        const folderPath = `./test-data/${repo}`;
        (0, cloc_1.clocSummary$)(folderPath)
            .pipe((0, rxjs_1.tap)({
            next: (stats) => {
                // there are 2 languages in the repo, Java and Python, and a summary line is present in the stats
                (0, chai_1.expect)(stats.length).equal(3);
                const javaStats = stats.find((stat) => stat.language === 'Java');
                (0, chai_1.expect)(javaStats).to.be.not.undefined;
                (0, chai_1.expect)(javaStats.nFiles).equal(2);
                const pythonStats = stats.find((stat) => stat.language === 'Python');
                (0, chai_1.expect)(pythonStats).to.be.not.undefined;
                (0, chai_1.expect)(pythonStats.nFiles).equal(1);
                (0, chai_1.expect)(pythonStats.code).equal(1);
                (0, chai_1.expect)(pythonStats.blank).equal(0);
                (0, chai_1.expect)(pythonStats.comment).equal(0);
                const summaryStats = stats.find((stat) => stat.language === 'SUM');
                (0, chai_1.expect)(summaryStats).to.be.not.undefined;
                (0, chai_1.expect)(summaryStats.nFiles).equal(3);
            },
        }))
            .subscribe({
            error: (err) => {
                done(err);
            },
            complete: () => done(),
        });
    }).timeout(200000);
    it(`read the cloc summary and, while notifying over a streams, writes the summary in a file`, (done) => {
        const repo = 'git-repo-with-code';
        const folderPath = `./test-data/${repo}`;
        const clocSummaryFile = path_1.default.join(process.cwd(), './temp', `${repo}-cloc-summary.csv`);
        (0, cloc_1.clocSummary$)(folderPath, undefined, clocSummaryFile)
            .pipe((0, rxjs_1.concatMap)(() => (0, observable_fs_1.readLinesObs)(clocSummaryFile)), (0, rxjs_1.tap)({
            next: (clocSummaryines) => {
                const javaStats = clocSummaryines.find((line) => line.includes('Java'));
                (0, chai_1.expect)(javaStats).to.be.not.undefined;
                const pythonStats = clocSummaryines.find((line) => line.includes('Python'));
                (0, chai_1.expect)(pythonStats).to.be.not.undefined;
                const summaryStats = clocSummaryines.find((line) => line.includes('SUM'));
                (0, chai_1.expect)(summaryStats).to.be.not.undefined;
            },
        }))
            .subscribe({
            error: (err) => {
                done(err);
            },
            complete: () => done(),
        });
    }).timeout(200000);
    it(`tries to run cloc summary on a folder that does not exist and returns an empty array`, (done) => {
        (0, cloc_1.clocSummary$)('not-existing-folder').subscribe({
            next: (stats) => {
                (0, chai_1.expect)(stats).empty;
            },
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(200000);
});
describe(`writeClocByfile`, () => {
    it(`read the number of lines for each file from the folder named as the repo and saves them in a file`, (done) => {
        const repo = 'git-repo-with-code';
        const outDir = path_1.default.join(process.cwd(), './temp');
        const params = {
            folderPath: `./test-data/${repo}`,
            outDir,
            vcs: '',
        };
        const expectedOutFilePath = path_1.default.join(outDir, `${repo}-cloc-byfile.csv`);
        const returnedOutFilePath = (0, cloc_1.writeClocByfile)(params, 'test');
        (0, chai_1.expect)(returnedOutFilePath).equal(expectedOutFilePath);
        (0, observable_fs_1.readLinesObs)(returnedOutFilePath).subscribe({
            next: (lines) => {
                (0, chai_1.expect)(lines).not.undefined;
                // there are 5 lines: 3 for the 3 files and 1 for the csv header, which is the first, and one for the sum which is the last
                (0, chai_1.expect)(lines.length).equal(5);
                const _fileName = './hallo.java';
                const [language, filename, blank, comment, code] = lines.find((l) => l.includes(_fileName)).split(',');
                (0, chai_1.expect)(language).equal('Java');
                (0, chai_1.expect)(filename).equal(`${_fileName}`);
                (0, chai_1.expect)(parseInt(blank)).equal(3);
                (0, chai_1.expect)(parseInt(comment)).equal(1);
                (0, chai_1.expect)(parseInt(code)).equal(5);
            },
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(200000);
});
describe(`clocByFileForRepos$`, () => {
    it(`notifies the cloc info for the files contained in all the repos of the folder of this project.
    Since this project contains just one repo, it notifies the cloc info for this repo.
    It starts with the cloc header`, (done) => {
        const repoFolder = './';
        (0, cloc_1.clocByFileForRepos$)(repoFolder).pipe((0, rxjs_1.toArray)(), (0, rxjs_1.tap)({
            next: (clocInfos) => {
                (0, chai_1.expect)(clocInfos.length).gt(1);
                // check that the first line starts with the cloc header and contains the repo name field
                const clocHeader = clocInfos[0];
                (0, chai_1.expect)(clocHeader).equal(cloc_1.clocByfileHeaderWithRepo);
                // check that the second line does not start with the cloc header repeated
                const secondLine = clocInfos[1];
                (0, chai_1.expect)(secondLine.includes(cloc_1.clocByfileHeader)).false;
                // check that the first record contains the number of expected fields and has the repo name field filled
                const firstRecord = clocInfos[1];
                const fields = firstRecord.split(',');
                (0, chai_1.expect)(fields[5]).equal('');
                (0, chai_1.expect)(fields[6]).equal(repoFolder);
                (0, chai_1.expect)(fields[7].trim().length).greaterThan(0);
                // find the last line which is not an empty string and check that it does not contain the sum
                const lastLine = clocInfos.reverse().find((line) => line.length > 0);
                (0, chai_1.expect)(lastLine).not.undefined;
                (0, chai_1.expect)(lastLine.includes('SUM')).false;
            },
            error: (err) => done(err),
            complete: () => done(),
        })).subscribe();
    }).timeout(200000);
    it(`it should throw and error since the folder does not exist`, () => {
        const repoFolder = './folder-that-does-not-exist';
        (0, chai_1.expect)(() => (0, cloc_1.clocByFileForRepos$)(repoFolder)).to.throw;
    }).timeout(200000);
    it(`notifies only the cloc header since the folder is not a git repo and does not contain any git repo`, (done) => {
        const repoFolder = './src';
        (0, cloc_1.clocByFileForRepos$)(repoFolder).pipe((0, rxjs_1.toArray)(), (0, rxjs_1.tap)({
            next: (clocInfos) => {
                (0, chai_1.expect)(clocInfos.length).equal(1);
                const clocHeader = clocInfos[0];
                (0, chai_1.expect)(clocHeader).equal(cloc_1.clocByfileHeaderWithRepo);
            },
            error: (err) => done(err),
            complete: () => done(),
        })).subscribe();
    }).timeout(200000);
});
describe(`writeClocByFileForRepos$`, () => {
    it(`notifies the name of the file where the cloc info for the repos in the folder have been written`, (done) => {
        const repoFolder = './';
        const outDir = './temp';
        let _outFile = '';
        let numOfFiles = 0;
        (0, cloc_1.writeClocByFileForRepos$)(repoFolder, outDir).pipe((0, rxjs_1.tap)({
            next: (outFile) => {
                _outFile = outFile;
                (0, chai_1.expect)(outFile.length).gt(1);
            },
        }), 
        // read the file just written and check that it contains the cloc header
        // save also the number of lines in the file so that later we can check that the file is overwritten
        // when we call writeClocByFileForRepos$ again
        (0, rxjs_1.concatMap)((outFile) => (0, observable_fs_1.readLinesObs)(outFile)), (0, rxjs_1.tap)({
            next: (lines) => {
                numOfFiles = lines.length;
                (0, chai_1.expect)(lines[0]).equal(cloc_1.clocByfileHeaderWithRepo);
                (0, chai_1.expect)(lines.length).gt(1);
            },
        }), 
        // now call writeClocByFileForRepos$ again and check that the file name is the same as the one returned in the first call
        (0, rxjs_1.concatMap)(() => (0, cloc_1.writeClocByFileForRepos$)(repoFolder, outDir)), (0, rxjs_1.tap)({
            next: (outFile) => {
                (0, chai_1.expect)(outFile).equal(_outFile);
            },
        }), 
        // now read the file written the second time and check that it has overwritten by comparing the number of lines
        // if the number of lines is the same as the first time, it means that the file has  been overwritten
        (0, rxjs_1.concatMap)((outFile) => {
            return (0, observable_fs_1.readLinesObs)(outFile);
        }), (0, rxjs_1.tap)({
            next: (lines) => {
                (0, chai_1.expect)(lines.length).equal(numOfFiles);
            },
            error: (err) => done(err),
            complete: () => done(),
        })).subscribe();
    }).timeout(200000);
    it(`it should throw and error since the folder does not exist`, () => {
        const repoFolder = './folder-that-does-not-exist';
        (0, chai_1.expect)(() => (0, cloc_1.writeClocByFileForRepos$)(repoFolder)).to.throw;
    }).timeout(200000);
});
describe(`clocByfile$`, () => {
    it(`completes if the folder is not a git repo`, (done) => {
        const params = {
            folderPath: '/',
            vcs: 'git',
        };
        (0, cloc_1.clocByfile$)(params, 'test', false)
            .subscribe({
            error: (err) => {
                done(err);
            },
            complete: () => {
                done();
            },
        });
    }).timeout(200000);
    it(`excludes files whose path contain certain strings`, (done) => {
        const params = {
            folderPath: '.',
            vcs: 'git',
            notMatch: ['src', 'test-data', 'dist'],
        };
        (0, cloc_1.clocByfile$)(params, 'test exclude', false).pipe((0, rxjs_1.toArray)(), (0, rxjs_1.tap)({
            next: (files) => {
                // having removed the src folder, the number of files should be less than 100
                (0, chai_1.expect)(files.length).lt(100);
            },
        })).subscribe({
            error: (err) => {
                done(err);
            },
            complete: () => {
                done();
            },
        });
    }).timeout(200000);
});
//# sourceMappingURL=cloc.spec.js.map