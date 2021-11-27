"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const path_1 = __importDefault(require("path"));
const operators_1 = require("rxjs/operators");
const observable_fs_1 = require("observable-fs");
const cloc_1 = require("./cloc");
describe(`createClocLog`, () => {
    it(`read the number of lines for each file from the folder named as the repo and saves them in a file`, (done) => {
        const repo = 'git-repo-with-code';
        const outDir = path_1.default.join(process.cwd(), './temp');
        const config = {
            repoFolderPath: `./test-data/${repo}`,
            outDir,
        };
        const expectedOutFilePath = path_1.default.join(outDir, `${repo}-cloc.csv`);
        const returnedOutFilePath = (0, cloc_1.createClocLog)(config, 'test');
        (0, chai_1.expect)(returnedOutFilePath).equal(expectedOutFilePath);
        (0, observable_fs_1.readLinesObs)(returnedOutFilePath).subscribe({
            next: (lines) => {
                (0, chai_1.expect)(lines).not.undefined;
                // there are 5 lines: 3 for the 3 files and 1 for the csv header, which is the first, and one for the sum which is the last
                (0, chai_1.expect)(lines.length).equal(5);
                const _fileName = 'hallo.java';
                const [language, filename, blank, comment, code] = lines.find((l) => l.includes(_fileName)).split(',');
                (0, chai_1.expect)(language).equal('Java');
                (0, chai_1.expect)(filename).equal(`./${_fileName}`);
                (0, chai_1.expect)(parseInt(blank)).equal(3);
                (0, chai_1.expect)(parseInt(comment)).equal(1);
                (0, chai_1.expect)(parseInt(code)).equal(5);
            },
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(20000);
});
describe(`createMultiClocLogs`, () => {
    it(`runs the cloc commmand on 2 files and read the files produced as the result of the commands`, (done) => {
        const repo_1 = 'a-git-repo';
        const repo_2 = 'a-git-repo-with-one-lazy-author';
        const outDir = path_1.default.join(process.cwd(), './temp');
        const outClocFilePrefix = 'multi-cloc-';
        const config = {
            repoFolderPaths: [`./test-data/${repo_1}`, `./test-data/${repo_2}`],
            outDir,
            outClocFilePrefix,
        };
        const expectedOutFilePath_1 = path_1.default.join(outDir, `${outClocFilePrefix}${repo_1}-cloc.csv`);
        const expectedOutFilePath_2 = path_1.default.join(outDir, `${outClocFilePrefix}${repo_2}-cloc.csv`);
        const clocFiles = (0, cloc_1.createMultiClocLogs)(config, 'a test');
        (0, chai_1.expect)(clocFiles[0]).equal(expectedOutFilePath_1);
        (0, chai_1.expect)(clocFiles[1]).equal(expectedOutFilePath_2);
        (0, observable_fs_1.readLinesObs)(clocFiles[0])
            .pipe((0, operators_1.tap)({
            next: (lines) => {
                (0, chai_1.expect)(lines).not.undefined;
                // there are 5 lines: 3 for the 3 files and 1 for the csv header, which is the first, and one for the sum which is the last
                (0, chai_1.expect)(lines.length).equal(5);
                const _fileName = 'hallo.java';
                const [language, filename, blank, comment, code] = lines
                    .find((l) => l.includes(_fileName))
                    .split(',');
                (0, chai_1.expect)(language).equal('Java');
                (0, chai_1.expect)(filename).equal(`./${_fileName}`);
                (0, chai_1.expect)(parseInt(blank)).equal(3);
                (0, chai_1.expect)(parseInt(comment)).equal(2);
                (0, chai_1.expect)(parseInt(code)).equal(5);
            },
        }), (0, operators_1.concatMap)(() => (0, observable_fs_1.readLinesObs)(clocFiles[1])), (0, operators_1.tap)({
            next: (lines) => {
                (0, chai_1.expect)(lines).not.undefined;
                // there are 3 lines: 1 for the only file and 1 for the csv header, which is the first, and one for the sum which is the last
                (0, chai_1.expect)(lines.length).equal(3);
                const _fileName = 'fake.java';
                const [language, filename, blank, comment, code] = lines
                    .find((l) => l.includes(_fileName))
                    .split(',');
                (0, chai_1.expect)(language).equal('Java');
                (0, chai_1.expect)(filename).equal(`./${_fileName}`);
                (0, chai_1.expect)(parseInt(blank)).equal(3);
                (0, chai_1.expect)(parseInt(comment)).equal(2);
                (0, chai_1.expect)(parseInt(code)).equal(5);
            },
        }))
            .subscribe({ error: (err) => done(err), complete: () => done() });
    }).timeout(20000);
});
describe(`createSummaryClocLog`, () => {
    it(`read the summary view provided by cloc from the folder named as the repo and saves it in a file`, (done) => {
        const repo = 'git-repo-with-code';
        const outDir = path_1.default.join(process.cwd(), './temp');
        const config = {
            repoFolderPath: `./test-data/${repo}`,
            outDir,
        };
        const expectedOutFilePath = path_1.default.join(outDir, `${repo}-summary-cloc.csv`);
        const returnedOutFilePath = (0, cloc_1.createSummaryClocLog)(config, 'test');
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
    }).timeout(20000);
});
describe(`clocFileDict`, () => {
    it(`create a dictionary with the file path as key and the cloc info as value`, (done) => {
        const logName = 'git-repo-with-code-cloc.gitlog';
        const logFilePath = path_1.default.join(process.cwd(), `/test-data/output/${logName}`);
        (0, cloc_1.clocFileDict)(logFilePath)
            .pipe((0, operators_1.tap)((dict) => {
            (0, chai_1.expect)(Object.keys(dict).length).equal(3);
            const _fileName = './hallo.java';
            (0, chai_1.expect)(dict[_fileName].language).equal('Java');
            (0, chai_1.expect)(dict[_fileName].filename).equal(_fileName);
            (0, chai_1.expect)(dict[_fileName].blank).equal(3);
            (0, chai_1.expect)(dict[_fileName].comment).equal(1);
            (0, chai_1.expect)(dict[_fileName].code).equal(5);
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    });
});
//# sourceMappingURL=cloc.spec.js.map