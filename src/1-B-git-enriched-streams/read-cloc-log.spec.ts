import { expect } from 'chai';
import path from 'path';
import { tap } from 'rxjs';
import { clocFileDict } from './read-cloc-log';

describe(`clocFileDict`, () => {
    it(`create a dictionary with the file path as key and the cloc info as value`, (done) => {
        const logName = 'git-repo-with-code-cloc.gitlog';
        const logFilePath = path.join(process.cwd(), `/test-data/output/${logName}`);

        clocFileDict(logFilePath)
            .pipe(
                tap((dict) => {
                    expect(Object.keys(dict).length).equal(3);
                    const _fileName = 'hallo.java';
                    expect(dict[_fileName].language).equal('Java');
                    expect(dict[_fileName].filename).equal(_fileName);
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
});
