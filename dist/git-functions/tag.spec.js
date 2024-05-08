"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const chai_1 = require("chai");
const observable_fs_1 = require("observable-fs");
const tag_1 = require("./tag");
describe(`writeTagsCommand`, () => {
    it(`builds the git log command to write the tags`, () => {
        const outDir = './temp';
        const outFile = 'io-backend-tags.log';
        const config = {
            repoFolderPath: './test-data/io-backend',
            outDir,
            outFile,
        };
        // the command build should be equivalent to this
        // git -C ./test-data/io-backend log --no-walk --tags --pretty="%h %d %s" --decorate=full > ./test-data/output/io-backend-tags.log`;
        const expectedOutfile = path_1.default.resolve(path_1.default.join(outDir, outFile));
        const expected = `git -C ${config.repoFolderPath} log --no-walk --tags --pretty='%h${tag_1.SEP}%d${tag_1.SEP}%s${tag_1.SEP}%ai' --decorate=full > ${expectedOutfile}`;
        const [cmd, out] = (0, tag_1.writeTagsCommand)(config);
        (0, chai_1.expect)(cmd).equal(expected);
        (0, chai_1.expect)(out).equal(expectedOutfile);
    });
});
describe(`writeTags`, () => {
    it(`read the tags from a git repo using git log command and saves them in a file`, (done) => {
        const outDir = './temp';
        const outFile = 'io-backend-tags.log';
        const config = {
            repoFolderPath: './',
            outDir,
            outFile,
        };
        const expectedOutFilePath = path_1.default.resolve(path_1.default.join(outDir, outFile));
        const returnedOutFilePath = (0, tag_1.writeTags)(config);
        (0, chai_1.expect)(returnedOutFilePath).equal(expectedOutFilePath);
        const outFilePath = path_1.default.join(process.cwd(), outDir, outFile);
        (0, observable_fs_1.readLinesObs)(outFilePath).subscribe({
            next: (lines) => {
                (0, chai_1.expect)(lines).not.undefined;
                // just check that there are some tags since the nuber of tags is not stable, 
                // e.g. is incremented any time the package is published
                (0, chai_1.expect)(lines.length).gt(0);
            },
            error: (err) => done(err),
            complete: () => done(),
        });
    });
});
describe(`readTags$`, () => {
    it(`read the tags from a git repo using git log command and streams the result, with one value per tag`, (done) => {
        const config = {
            repoFolderPath: './',
        };
        (0, tag_1.readTags$)(config).subscribe({
            next: (lines) => {
                (0, chai_1.expect)(lines).not.undefined;
                // just check that there are some tags since the nuber of tags is not stable, 
                // e.g. is incremented any time the package is published
                (0, chai_1.expect)(lines.length).gt(0);
                // expect each line not to be empty
                lines.forEach((line) => {
                    (0, chai_1.expect)(line.trim().length).gt(0);
                });
            },
            error: (err) => done(err),
            complete: () => done(),
        });
    });
});
//# sourceMappingURL=tag.spec.js.map