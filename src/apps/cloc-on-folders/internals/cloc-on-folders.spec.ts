import { tap } from "rxjs";
import { clocOnFolders } from "./cloc-on-folders";
import { readLinesObs } from 'observable-fs'
import { expect } from "chai";

describe('clocOnFolders', () => {
    it(`should calculate the cloc on this project folder. Should not contain any file in the node_modules folder
    since we are using the vcs=git option`, (done) => {
        const folderPath = '.';
        const outDir = './temp'

        const outFile = clocOnFolders(folderPath, outDir)

        readLinesObs(outFile).pipe(
            tap({
                next: lines => {
                    expect(lines.length).gt(0)
                    lines.forEach(line => {
                        expect(line).not.to.contain('node_modules')
                    })
                },
                error: err => {
                    done(err);
                },
                complete: () => {
                    done();
                }
            })
        ).subscribe()

    }).timeout(200000);

});