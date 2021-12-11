"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const read_all_1 = require("./read-all");
describe(`performance tests`, () => {
    it(`test performance for write`, () => {
        const repoFolderPath = '/Users/enricopiccinin/enrico-code/articles/2021-09-analize-git-data/2021-09-29-sample-repos/kubernetes';
        const outDir = `${process.cwd()}/temp`;
        const gitCommitConfig_1 = {
            repoFolderPath,
            outDir,
            outFile: 'read-all-same-thread',
        };
        const gitCommitConfig_2 = {
            repoFolderPath,
            outDir,
            outFile: 'read-all-separate-processes',
        };
        const clocConfig_1 = {
            repoFolderPath,
            outDir,
            outClocFilePrefix: `ead-all-same-thread-`,
        };
        const clocConfig_2 = {
            repoFolderPath,
            outDir,
            outClocFilePrefix: `read-all-separate-processes-`,
        };
        let start;
        let end;
        start = Date.now();
        (0, read_all_1.readAll)(gitCommitConfig_1, clocConfig_1);
        end = Date.now();
        const timeForReadInSameThread = end - start;
        start = Date.now();
        (0, read_all_1.readAllParallel)(gitCommitConfig_2, clocConfig_2).subscribe((data) => {
            end = Date.now();
            console.log('+++++++++++++++++++++++++++++++++++++++++ Read in the same thread ', timeForReadInSameThread);
            const timeForReadInSeprateProcesses = end - start;
            console.log('+++++++++++++++++++++++++++++++++++++++++ Read in the separate processes ', timeForReadInSeprateProcesses);
            console.log(data);
        });
    }).timeout(2000000);
});
//# sourceMappingURL=read-all.spec.skip.js.map