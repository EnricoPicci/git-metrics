import path from "path";
import { expect } from "chai";

import { readLinesObs } from "observable-fs";

import { GitCommandParams } from "./git-params";
import { readBranchesGraph, readBranchesGraphCommand } from "./branches.functions";


describe(`readBranchesGraph`, () => {
    it(`builds the git log command to read the graph of the branches`, () => {
        const outDir = './temp';
        const outFile = 'io-backend-branches-graph.log';
        const config: GitCommandParams = {
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
});



describe(`readBranchesGraph`, () => {
    it(`read the graphs log from a git repo using git log command and saves them in a file`, (done) => {
        const outDir = './temp';
        const outFile = 'io-backend-tags.log';
        const config: GitCommandParams = {
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