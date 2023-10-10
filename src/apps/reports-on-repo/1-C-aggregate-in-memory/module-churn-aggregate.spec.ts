import { expect } from 'chai';
import path from 'path';

import { tap } from 'rxjs/operators';
import { filesStream } from '../1-B-git-enriched-streams/files';
import { fileChurn } from './file-churn-aggregate';
import { moduleChurns } from './module-churn-aggregate';

describe(`moduleChurns`, () => {
    it(`generates a stream of ModuleChurn objects starting from a git commit log file and enriching
    the commit data with the data from cloc log`, (done) => {
        const repoName = 'a-real-world-git-repo';
        const commitLogPath = path.join(process.cwd(), `/test-data/output/${repoName}-commits.gitlog`);
        const clocLogPath = path.join(process.cwd(), `/test-data/output/${repoName}-cloc.gitlog`);

        const fileCommits = filesStream(commitLogPath, clocLogPath);
        const fileChurns = fileChurn(fileCommits, true);

        moduleChurns(fileChurns)
            .pipe(
                tap((moduleChurns) => {
                    expect(moduleChurns.length).equal(8);
                    // there is only one entry for src module
                    const src = moduleChurns.filter((mc) => mc.path === './src');
                    expect(src.length).equal(1);
                    // there is only one entry for src/yypes module
                    const srcTypes = moduleChurns.filter((mc) => mc.path === './src/types');
                    expect(srcTypes.length).equal(1);
                    // there is only one entry for src/controllers module
                    const srcControllers = moduleChurns.filter((mc) => mc.path === './src/controllers');
                    expect(srcControllers.length).equal(1);
                    //
                    const srcTypesModuleChurn = srcTypes[0];
                    const srcControllersModuleChurn = srcControllers[0];
                    const srcModuleChurn = src[0];
                    expect(srcTypesModuleChurn.depth).equal(2);
                    expect(srcTypesModuleChurn.numChurnedFiles).equal(1);
                    expect(srcTypesModuleChurn.cloc).equal(11);
                    expect(srcTypesModuleChurn.cloc_own).equal(11);
                    expect(srcTypesModuleChurn.linesAdded).equal(100);
                    expect(srcTypesModuleChurn.linesAdded_own).equal(100);
                    expect(srcTypesModuleChurn.linesDeleted).equal(5);
                    expect(srcTypesModuleChurn.linesDeleted_own).equal(5);
                    expect(srcTypesModuleChurn.linesAddDel).equal(105);
                    expect(srcTypesModuleChurn.linesAddDel_own).equal(105);
                    expect(srcControllersModuleChurn.depth).equal(2);
                    expect(srcControllersModuleChurn.numChurnedFiles).equal(2);
                    expect(srcControllersModuleChurn.cloc).equal(103);
                    expect(srcControllersModuleChurn.cloc_own).equal(49);
                    expect(srcControllersModuleChurn.linesAdded).equal(126);
                    expect(srcControllersModuleChurn.linesAdded_own).equal(60);
                    expect(srcControllersModuleChurn.linesDeleted).equal(6);
                    expect(srcControllersModuleChurn.linesDeleted_own).equal(5);
                    expect(srcControllersModuleChurn.linesAddDel).equal(132);
                    expect(srcControllersModuleChurn.linesAddDel_own).equal(65);
                    expect(srcModuleChurn.depth).equal(1);
                    expect(srcModuleChurn.numChurnedFiles).equal(11);
                    expect(srcModuleChurn.cloc_own).equal(1439);
                    expect(srcModuleChurn.linesAdded).equal(468);
                    expect(srcModuleChurn.linesDeleted).equal(17);
                    expect(srcModuleChurn.linesAddDel).equal(485);
                    expect(srcModuleChurn.created.toDateString()).equal(new Date('2021-07-13').toDateString());
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(200000);
    it(`generates a stream of ModuleChurn objects for a repo where files are stored in the root (e.g. are in ./)`, (done) => {
        const repoName = 'a-git-repo';
        const commitLogPath = path.join(process.cwd(), `/test-data/output/${repoName}-commits.gitlog`);
        const clocLogPath = path.join(process.cwd(), `/test-data/output/${repoName}-cloc.gitlog`);

        const fileCommits = filesStream(commitLogPath, clocLogPath);
        const fileChurns = fileChurn(fileCommits, true);

        moduleChurns(fileChurns)
            .pipe(
                tap((moduleChurns) => {
                    expect(moduleChurns.length).equal(1);
                    //
                    const rootModule = moduleChurns[0];
                    expect(rootModule.path).equal('.');
                    expect(rootModule.linesAdded).equal(23);
                    expect(rootModule.linesDeleted).equal(5);
                    expect(rootModule.linesAddDel).equal(28);
                    expect(rootModule.numChurnedFiles).equal(3);
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(200000);
    it(`generates a stream of ModuleChurn objects for a repo where files are stored in the root (e.g. are in ./) and in a folder (./java)`, (done) => {
        const repoName = 'a-git-repo-with-files-in-root-and-folder';
        const commitLogPath = path.join(process.cwd(), `/test-data/output/${repoName}-commits.gitlog`);
        const clocLogPath = path.join(process.cwd(), `/test-data/output/${repoName}-cloc.gitlog`);

        const fileCommits = filesStream(commitLogPath, clocLogPath);
        const fileChurns = fileChurn(fileCommits, true);

        moduleChurns(fileChurns)
            .pipe(
                tap((moduleChurns) => {
                    expect(moduleChurns.length).equal(2);
                    //
                    const rootModule = moduleChurns.find((m) => m.path === '.')!;
                    expect(rootModule.linesAdded).equal(23);
                    expect(rootModule.linesDeleted).equal(5);
                    expect(rootModule.linesAddDel).equal(28);
                    expect(rootModule.numChurnedFiles).equal(3);
                    //
                    const folderModule = moduleChurns.find((m) => m.path === './java')!;
                    expect(folderModule.linesAdded).equal(21);
                    expect(folderModule.linesDeleted).equal(4);
                    expect(folderModule.linesAddDel).equal(25);
                    expect(folderModule.numChurnedFiles).equal(2);
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(200000);
});
