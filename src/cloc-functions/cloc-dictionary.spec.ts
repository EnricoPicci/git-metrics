import { expect } from 'chai';
import path from 'path';
import { tap } from 'rxjs';
import { clocFileDict$, clocFileDictFromClocLogFile$ } from './cloc-dictionary';

describe(`clocFileDict$`, () => {
    it(`create a cloc dictionary for the folder where this project is contained`, (done) => {
        const folderPath = './';

        clocFileDict$(folderPath)
            .pipe(
                tap((dict) => {
                    expect(Object.keys(dict).length).gt(0);
                    // read the dict entry of this file
                    const thisFolderPathLegth = process.cwd().length;
                    const thisFilePath = __filename.substring(thisFolderPathLegth + 1);
                    const thisFileClocInfo = dict[thisFilePath]
                    expect(thisFileClocInfo.language).equal('TypeScript');
                    expect(thisFileClocInfo.file).equal(thisFilePath);
                    expect(thisFileClocInfo.blank).gt(0);
                    expect(thisFileClocInfo.comment).gt(0);
                    expect(thisFileClocInfo.code).gt(0);
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(20000);

    it(`throws since the folder does not exist`, () => {
        const folderPath = 'not-existing-path';

        expect(() => clocFileDict$(folderPath)).throw
    });
});

describe(`clocFileDictFromClocLogFile$`, () => {
    it(`create a dictionary with the file path as key and the cloc info as value`, (done) => {
        const logName = 'git-repo-with-code-cloc.gitlog';
        const logFilePath = path.join(process.cwd(), `/test-data/output/${logName}`);

        clocFileDictFromClocLogFile$(logFilePath)
            .pipe(
                tap((dict) => {
                    expect(Object.keys(dict).length).equal(3);
                    const _fileName = 'hallo.java';
                    expect(dict[_fileName].language).equal('Java');
                    expect(dict[_fileName].file).equal(_fileName);
                    expect(dict[_fileName].blank).equal(3);
                    expect(dict[_fileName].comment).equal(1);
                    expect(dict[_fileName].code).equal(5);
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    });

    it(`try to create a dictionary with a file wihch is not found`, (done) => {
        const logName = 'not-existing-log.gitlog';
        const logFilePath = path.join(process.cwd(), `/test-data/output/${logName}`);

        clocFileDictFromClocLogFile$(logFilePath)
            .pipe(
                tap((dict) => {
                    expect(Object.keys(dict).length).equal(0);
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    });
});
