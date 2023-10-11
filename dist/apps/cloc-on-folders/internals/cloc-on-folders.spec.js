"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rxjs_1 = require("rxjs");
const cloc_on_folders_1 = require("./cloc-on-folders");
const observable_fs_1 = require("observable-fs");
const chai_1 = require("chai");
describe('clocOnFolders', () => {
    it(`should calculate the cloc on this project folder. Should not contain any file in the node_modules folder
    since we are using the vcs=git option`, (done) => {
        const folderPath = '.';
        const outDir = './temp';
        const outFile = (0, cloc_on_folders_1.clocOnFolders)(folderPath, outDir);
        (0, observable_fs_1.readLinesObs)(outFile).pipe((0, rxjs_1.tap)({
            next: lines => {
                (0, chai_1.expect)(lines.length).gt(0);
                lines.forEach(line => {
                    (0, chai_1.expect)(line).not.to.contain('node_modules');
                });
            },
            error: err => {
                done(err);
            },
            complete: () => {
                done();
            }
        })).subscribe();
    }).timeout(200000);
});
//# sourceMappingURL=cloc-on-folders.spec.js.map