import { expect } from 'chai';
import { buildOutfileName, clocByFileForRepos$, clocByfile$, clocByfileHeader, clocByfileHeaderWithRepo, clocSummary$, writeClocByFile$, writeClocByFileForRepos$, writeClocByfile, writeClocSummary } from './cloc';
import { ClocParams } from './cloc-params';
import path from 'path';
import { deleteFile } from '../tools/test-helpers/delete-file';
import { concatMap, tap, toArray } from 'rxjs';
import { readLinesObs } from 'observable-fs';

// #copilot - most of the boilerplate of these tests was generated by copilot
describe('clocSummary$', () => {
    it('should return an array of language statistics', (done) => {
        clocSummary$('./src').subscribe((stats) => {
            expect(stats instanceof Array).to.be.true;
            expect(stats.length).greaterThan(0);
            expect(!!stats[0].language).to.be.true;
            expect(stats[0].nFiles).greaterThan(0);
            expect(stats[0].blank).greaterThan(0);
            expect(stats[0].comment).greaterThan(0);
            expect(stats[0].code).greaterThan(0);
            done();
        });
    }).timeout(10000);

    it('should return statistics for TypeScript files', (done) => {
        clocSummary$('./src').subscribe((stats) => {
            const typescriptStats = stats.find((stat) => stat.language === 'TypeScript');
            expect(!!typescriptStats).to.be.true;
            expect(typescriptStats!.nFiles).greaterThan(0);
            expect(typescriptStats!.blank).greaterThan(0);
            expect(typescriptStats!.comment).greaterThan(0);
            expect(typescriptStats!.code).greaterThan(0);
            done();
        });
    }).timeout(10000);

    it('should return statistics reading from a git repo commit - the commit is from the repo of this project', (done) => {
        clocSummary$('2c6f2ae87b539590f5a0f93682f5440ca845bc9c').subscribe((stats) => {
            const typescriptStats = stats.find((stat) => stat.language === 'TypeScript');
            expect(!!typescriptStats).to.be.true;
            expect(typescriptStats!.nFiles).greaterThan(0);
            expect(typescriptStats!.blank).greaterThan(0);
            expect(typescriptStats!.comment).greaterThan(0);
            expect(typescriptStats!.code).greaterThan(0);
            done();
        });
    }).timeout(10000);
});

describe('buildOutfileName', () => {
    const thisFolderName = 'git-metrics';

    it('should return the provided output file name if it is provided', () => {
        const outFile = 'output.txt';
        const result = buildOutfileName(outFile);
        expect(result).to.equal(outFile);
    });

    it('should generate an output file name based on the provided parameters', () => {
        const prefix = 'prefix_';
        const repoFolder = '/path/to/repo';
        const postfix = '_postfix';
        const expected = `${prefix}repo${postfix}`;
        const result = buildOutfileName('', repoFolder, prefix, postfix);
        expect(result).to.equal(expected);
    });

    it('should use the current working directory name as the base folder name since repo folder is not passed as param', () => {
        const prefix = 'prefix_';
        const postfix = '_postfix';
        const expected = `${prefix}${thisFolderName}${postfix}`;
        const result = buildOutfileName('', '', prefix, postfix);
        expect(result).to.equal(expected);
    });

    it('should use an empty string as the prefix if prefix is not provided', () => {
        const repoFolder = '/path/to/repo';
        const postfix = '_postfix';
        const expected = `repo${postfix}`;
        const result = buildOutfileName('', repoFolder, undefined, postfix);
        expect(result).to.equal(expected);
    });

    it('should use an empty string as the postfix if postfix is not provided', () => {
        const prefix = 'prefix_';
        const repoFolder = '/path/to/repo';
        const expected = `${prefix}repo`;
        const result = buildOutfileName('', repoFolder, prefix, undefined);
        expect(result).to.equal(expected);
    });

    it('should use the current working directory name as the base folder name if repoFolder is "."', () => {
        const prefix = 'prefix_';
        const postfix = '_postfix';
        const expected = `${prefix}${thisFolderName}${postfix}`;
        const result = buildOutfileName('', '.', prefix, postfix);
        expect(result).to.equal(expected);
    });

    it('should use the current working directory name as the base folder name if repoFolder is "."', () => {
        const prefix = 'prefix_';
        const postfix = '_postfix';
        const expected = `${prefix}${thisFolderName}${postfix}`;
        const result = buildOutfileName('', './', prefix, postfix);
        expect(result).to.equal(expected);
    });

    it('should use the current working directory name as the base folder name if repoFolder is an empty string', () => {
        const prefix = 'prefix_';
        const postfix = '_postfix';
        const expected = `${prefix}${thisFolderName}${postfix}`;
        const result = buildOutfileName('', '', prefix, postfix);
        expect(result).to.equal(expected);
    });
});

describe(`writeClocByFile$`, () => {
    it(`read the number of lines for each file from the folder named as the repo and saves them in a file - works in a new process`, (done) => {
        const repo = 'git-repo-with-code';
        const outDir = path.join(process.cwd(), './temp');

        const outClocFilePrefix = 'new-process';
        const config: ClocParams = {
            folderPath: `./test-data/${repo}`,
            outDir,
            outClocFilePrefix,
            vcs: '',
        };

        const expectedOutFilePath = outDir + '/' + outClocFilePrefix + repo + '-cloc-byfile.csv';

        let counter = 0;

        deleteFile(expectedOutFilePath)
            .pipe(
                concatMap(() => writeClocByFile$(config, 'test')),
                tap({
                    next: (returnedOutFilePath) => {
                        expect(returnedOutFilePath).equal(expectedOutFilePath);
                        counter++;
                    },
                }),
                concatMap((returnedOutFilePath) => readLinesObs(returnedOutFilePath)),
                tap({
                    next: (lines) => {
                        expect(lines).not.undefined;
                        // there are 5 lines: 3 for the 3 files and 1 for the csv header, which is the first, and one for the sum which is the last
                        expect(lines.length).equal(5);
                        const _fileName = './hallo.java';
                        const [language, filename, blank, comment, code] = lines
                            .find((l) => l.includes(_fileName))!
                            .split(',');
                        expect(language).equal('Java');
                        expect(filename).equal(`${_fileName}`);
                        expect(parseInt(blank)).equal(3);
                        expect(parseInt(comment)).equal(1);
                        expect(parseInt(code)).equal(5);
                    },
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => {
                    expect(counter).equal(1);
                    done();
                },
            });
    }).timeout(200000);
});

describe(`writeClocSummary`, () => {
    it(`read the summary view provided by cloc from the folder named as the repo and saves it in a file`, (done) => {
        const repo = 'git-repo-with-code';
        const outDir = path.join(process.cwd(), './temp');
        const config: ClocParams = {
            folderPath: `./test-data/${repo}`,
            outDir,
            vcs: '',
        };
        const expectedOutFilePath = path.join(outDir, `${repo}-cloc-summary.csv`);
        const returnedOutFilePath = writeClocSummary(config, 'test');
        expect(returnedOutFilePath).equal(expectedOutFilePath);
        readLinesObs(returnedOutFilePath).subscribe({
            next: (lines) => {
                expect(lines).not.undefined;
                // there are 4 lines: 2 for the 2 languages (java nd python) and 1 for the csv header, which is the first,
                // and one for the sum which is the last
                expect(lines.length).equal(4);
                const _language = 'Java';
                const [files, language, blank, comment, code] = lines.find((l) => l.includes(_language))!.split(',');
                expect(language).equal('Java');
                expect(parseInt(files)).equal(2);
                expect(parseInt(blank)).equal(3);
                expect(parseInt(comment)).equal(3);
                expect(parseInt(code)).equal(10);
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

        clocSummary$(folderPath)
            .pipe(
                tap({
                    next: (stats) => {
                        // there are 2 languages in the repo, Java and Python, and a summary line is present in the stats
                        expect(stats.length).equal(3);

                        const javaStats = stats.find((stat) => stat.language === 'Java');
                        expect(javaStats).to.be.not.undefined;
                        expect(javaStats!.nFiles).equal(2);

                        const pythonStats = stats.find((stat) => stat.language === 'Python');
                        expect(pythonStats).to.be.not.undefined;
                        expect(pythonStats!.nFiles).equal(1);
                        expect(pythonStats!.code).equal(1);
                        expect(pythonStats!.blank).equal(0);
                        expect(pythonStats!.comment).equal(0);

                        const summaryStats = stats.find((stat) => stat.language === 'SUM');
                        expect(summaryStats).to.be.not.undefined;
                        expect(summaryStats!.nFiles).equal(3);
                    },
                }),
            )
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

        const clocSummaryFile = path.join(process.cwd(), './temp', `${repo}-cloc-summary.csv`);

        clocSummary$(folderPath, undefined, clocSummaryFile)
            .pipe(
                concatMap(() => readLinesObs(clocSummaryFile)),
                tap({
                    next: (clocSummaryines) => {
                        const javaStats = clocSummaryines.find((line) => line.includes('Java'));
                        expect(javaStats).to.be.not.undefined;
                        const pythonStats = clocSummaryines.find((line) => line.includes('Python'));
                        expect(pythonStats).to.be.not.undefined;
                        const summaryStats = clocSummaryines.find((line) => line.includes('SUM'));
                        expect(summaryStats).to.be.not.undefined;
                    },
                }),
            )
            .subscribe({
                error: (err) => {
                    done(err);
                },
                complete: () => done(),
            });
    }).timeout(200000);

    it(`tries to run cloc summary on a folder that does not exist and returns an empty array`, (done) => {
        clocSummary$('not-existing-folder').subscribe({
            next: (stats) => {
                expect(stats).empty;
            },
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(200000);
});

describe(`writeClocByfile`, () => {
    it(`read the number of lines for each file from the folder named as the repo and saves them in a file`, (done) => {
        const repo = 'git-repo-with-code';
        const outDir = path.join(process.cwd(), './temp');
        const params: ClocParams = {
            folderPath: `./test-data/${repo}`,
            outDir,
            vcs: '',
        };
        const expectedOutFilePath = path.join(outDir, `${repo}-cloc-byfile.csv`);
        const returnedOutFilePath = writeClocByfile(params, 'test');
        expect(returnedOutFilePath).equal(expectedOutFilePath);
        readLinesObs(returnedOutFilePath).subscribe({
            next: (lines) => {
                expect(lines).not.undefined;
                // there are 5 lines: 3 for the 3 files and 1 for the csv header, which is the first, and one for the sum which is the last
                expect(lines.length).equal(5);
                const _fileName = './hallo.java';
                const [language, filename, blank, comment, code] = lines.find((l) => l.includes(_fileName))!.split(',');
                expect(language).equal('Java');
                expect(filename).equal(`${_fileName}`);
                expect(parseInt(blank)).equal(3);
                expect(parseInt(comment)).equal(1);
                expect(parseInt(code)).equal(5);
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

        clocByFileForRepos$(repoFolder).pipe(
            toArray(),
            tap({
                next: (clocInfos) => {
                    expect(clocInfos.length).gt(1);
                    // check that the first line starts with the cloc header and contains the repo name field
                    const clocHeader = clocInfos[0];
                    expect(clocHeader).equal(clocByfileHeaderWithRepo);
                    // check that the second line does not start with the cloc header repeated
                    const secondLine = clocInfos[1];
                    expect(secondLine.includes(clocByfileHeader)).false
                    // check that the first record contains the number of expected fields and has the repo name field filled
                    const firstRecord = clocInfos[1];
                    const fields = firstRecord.split(',');
                    expect(fields[5]).equal('');
                    expect(fields[6]).equal(repoFolder);
                    expect(fields[7].trim().length).greaterThan(0);
                    // find the last line which is not an empty string and check that it does not contain the sum
                    const lastLine = clocInfos.reverse().find((line) => line.length > 0);
                    expect(lastLine).not.undefined;
                    expect(lastLine!.includes('SUM')).false;
                },
                error: (err) => done(err),
                complete: () => done(),
            }),
        ).subscribe();
    }).timeout(200000);
    it(`it should throw and error since the folder does not exist`, () => {
        const repoFolder = './folder-that-does-not-exist';

        expect(() => clocByFileForRepos$(repoFolder)).to.throw;
    }).timeout(200000);
    it(`notifies only the cloc header since the folder is not a git repo and does not contain any git repo`, (done) => {
        const repoFolder = './src';

        clocByFileForRepos$(repoFolder).pipe(
            toArray(),
            tap({
                next: (clocInfos) => {
                    expect(clocInfos.length).equal(1);
                    const clocHeader = clocInfos[0];
                    expect(clocHeader).equal(clocByfileHeaderWithRepo);
                },
                error: (err) => done(err),
                complete: () => done(),
            }),
        ).subscribe();
    }).timeout(200000);
});

describe(`writeClocByFileForRepos$`, () => {
    it(`notifies the name of the file where the cloc info for the repos in the folder have been written`, (done) => {
        const repoFolder = './';
        const outDir = './temp';

        let _outFile = '';
        let numOfFiles = 0;

        writeClocByFileForRepos$(repoFolder, new Date(), outDir).pipe(
            tap({
                next: ([outFile, _]) => {
                    _outFile = outFile;
                    expect(outFile.length).gt(1);
                },
            }),
            // read the file just written and check that it contains the cloc header
            // save also the number of lines in the file so that later we can check that the file is overwritten
            // when we call writeClocByFileForRepos$ again
            concatMap(([outFile, _]) => readLinesObs(outFile)),
            tap({
                next: (lines) => {
                    numOfFiles = lines.length;
                    expect(lines[0]).equal(clocByfileHeaderWithRepo);
                    expect(lines.length).gt(1);
                },
            }),
            // now call writeClocByFileForRepos$ again and check that the file name is the same as the one returned in the first call
            concatMap(() => writeClocByFileForRepos$(repoFolder, new Date(), outDir)),
            tap({
                next: (outFile) => {
                    expect(outFile).equal(_outFile);
                },
            }),
            // now read the file written the second time and check that it has overwritten by comparing the number of lines
            // if the number of lines is the same as the first time, it means that the file has  been overwritten
            concatMap(([outFile, _]) => {
                return readLinesObs(outFile)
            }),
            tap({
                next: (lines) => {
                    expect(lines.length).equal(numOfFiles);
                },
                error: (err) => done(err),
                complete: () => done(),
            }),
        ).subscribe();
    }).timeout(200000);
    it(`it should throw and error since the folder does not exist`, () => {
        const repoFolder = './folder-that-does-not-exist';

        expect(() => writeClocByFileForRepos$(repoFolder)).to.throw;
    }).timeout(200000);
});

describe(`clocByfile$`, () => {
    it(`completes if the folder is not a git repo`, (done) => {
        const params: ClocParams = {
            folderPath: '/',  // the root folder of the file system is not a git repo
            vcs: 'git',
        };

        clocByfile$(params, 'test', false)
            .subscribe({
                error: (err) => {
                    done(err)
                },
                complete: () => {
                    done()
                },
            });
    }).timeout(200000);

    it(`excludes files whose path contain certain strings`, (done) => {
        const params: ClocParams = {
            folderPath: '.',  // thit project repo
            vcs: 'git',
            notMatch: ['src', 'test-data', 'dist'],
        };

        clocByfile$(params, 'test exclude', false).pipe(
            toArray(),
            tap({
                next: (files) => {
                    // having removed the src folder, the number of files should be less than 100
                    expect(files.length).lt(100);
                },
            }),
        ).subscribe({
            error: (err) => {
                done(err)
            },
            complete: () => {
                done()
            },
        });
    }).timeout(200000);

});