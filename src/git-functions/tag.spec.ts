import path from "path";

import { expect } from "chai";
import { readLinesObs } from "observable-fs";

import { GitCommandParams } from "./git-params";
import { SEP, readTags$, writeTags, writeTagsCommand } from "./tag";


describe(`writeTagsCommand`, () => {
    it(`builds the git log command to write the tags`, () => {
        const outDir = './temp';
        const outFile = 'io-backend-tags.log';
        const config: GitCommandParams = {
            repoFolderPath: './test-data/io-backend',
            outDir,
            outFile,
        };
        // the command build should be equivalent to this
        // git -C ./test-data/io-backend log --no-walk --tags --pretty="%h %d %s" --decorate=full > ./test-data/output/io-backend-tags.log`;
        const expectedOutfile = path.resolve(path.join(outDir, outFile));
        const expected = `git -C ${config.repoFolderPath} log --no-walk --tags --pretty='%h${SEP}%d${SEP}%s${SEP}%ai' --decorate=full > ${expectedOutfile}`;
        const [cmd, out] = writeTagsCommand(config);
        expect(cmd).equal(expected);
        expect(out).equal(expectedOutfile);
    });
});

describe(`writeTags`, () => {
    it(`read the tags from a git repo using git log command and saves them in a file`, (done) => {
        const outDir = './temp';
        const outFile = 'io-backend-tags.log';
        const config: GitCommandParams = {
            repoFolderPath: './',
            outDir,
            outFile,
        };
        const expectedOutFilePath = path.resolve(path.join(outDir, outFile));
        const returnedOutFilePath = writeTags(config);
        expect(returnedOutFilePath).equal(expectedOutFilePath);
        const outFilePath = path.join(process.cwd(), outDir, outFile);
        readLinesObs(outFilePath).subscribe({
            next: (lines) => {
                expect(lines).not.undefined;
                // just check that there are some tags since the nuber of tags is not stable, 
                // e.g. is incremented any time the package is published
                expect(lines.length).gt(0);
            },
            error: (err) => done(err),
            complete: () => done(),
        });
    });
});

describe(`readTags$`, () => {
    it(`read the tags from a git repo using git log command and streams the result, with one value per tag`, (done) => {
        const config: GitCommandParams = {
            repoFolderPath: './',
        };

        readTags$(config).subscribe({
            next: (lines) => {
                expect(lines).not.undefined;
                // just check that there are some tags since the nuber of tags is not stable, 
                // e.g. is incremented any time the package is published
                expect(lines.length).gt(0);
                // expect each line not to be empty
                lines.forEach((line) => {
                    expect(line.trim().length).gt(0);
                });
            },
            error: (err) => done(err),
            complete: () => done(),
        })
    });
});