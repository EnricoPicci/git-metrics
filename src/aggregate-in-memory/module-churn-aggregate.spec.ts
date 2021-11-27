import { expect } from 'chai';
import path from 'path';

import { tap } from 'rxjs/operators';
import { filesStream } from '../git-read-enrich/files';
import { fileChurn } from './file-churn-aggregate';
import { moduleChurns } from './module-churn-aggregate';

describe(`moduleChurns`, () => {
    it(`generates a stream of ModuleChurn objects`, (done) => {
        const repoName = 'a-real-world-git-repo';
        const commitLogPath = path.join(process.cwd(), `/test-data/output/${repoName}-commits.gitlog`);
        const clocLogPath = path.join(process.cwd(), `/test-data/output/${repoName}-cloc.gitlog`);

        const fileCommits = filesStream(commitLogPath, clocLogPath);
        const fileChurns = fileChurn(fileCommits);

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
                    expect(srcTypesModuleChurn.linesAdded).equal(100);
                    expect(srcTypesModuleChurn.linesDeleted).equal(5);
                    expect(srcTypesModuleChurn.linesAddDel).equal(105);
                    expect(srcControllersModuleChurn.numFiles).equal(2);
                    expect(srcControllersModuleChurn.linesAdded).equal(126);
                    expect(srcControllersModuleChurn.linesDeleted).equal(6);
                    expect(srcControllersModuleChurn.linesAddDel).equal(132);
                    expect(srcModuleChurn.numFiles).equal(11);
                    expect(srcModuleChurn.linesAdded).equal(468);
                    expect(srcModuleChurn.linesDeleted).equal(17);
                    expect(srcModuleChurn.linesAddDel).equal(485);
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(20000);
    it(`generates a stream of ModuleChurn objects for a repo where files are stored in the root (e.g. are in ./)`, (done) => {
        const repoName = 'a-git-repo';
        const commitLogPath = path.join(process.cwd(), `/test-data/output/${repoName}-commits.gitlog`);
        const clocLogPath = path.join(process.cwd(), `/test-data/output/${repoName}-cloc.gitlog`);

        const fileCommits = filesStream(commitLogPath, clocLogPath);
        const fileChurns = fileChurn(fileCommits);

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
                    expect(rootModule.numFiles).equal(3);
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(20000);
    it(`generates a stream of ModuleChurn objects for a repo where files are stored in the root (e.g. are in ./) and in a folder (./java)`, (done) => {
        const repoName = 'a-git-repo-with-files-in-root-and-folder';
        const commitLogPath = path.join(process.cwd(), `/test-data/output/${repoName}-commits.gitlog`);
        const clocLogPath = path.join(process.cwd(), `/test-data/output/${repoName}-cloc.gitlog`);

        const fileCommits = filesStream(commitLogPath, clocLogPath);
        const fileChurns = fileChurn(fileCommits);

        moduleChurns(fileChurns)
            .pipe(
                tap((moduleChurns) => {
                    expect(moduleChurns.length).equal(2);
                    //
                    const rootModule = moduleChurns.find((m) => m.path === '.');
                    expect(rootModule.linesAdded).equal(23);
                    expect(rootModule.linesDeleted).equal(5);
                    expect(rootModule.linesAddDel).equal(28);
                    expect(rootModule.numFiles).equal(3);
                    //
                    const folderModule = moduleChurns.find((m) => m.path === './java');
                    expect(folderModule.linesAdded).equal(21);
                    expect(folderModule.linesDeleted).equal(4);
                    expect(folderModule.linesAddDel).equal(25);
                    expect(folderModule.numFiles).equal(2);
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(20000);
});
