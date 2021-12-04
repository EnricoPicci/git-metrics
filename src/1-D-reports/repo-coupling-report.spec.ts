import { expect } from 'chai';
import path from 'path';
import { tap, toArray } from 'rxjs/operators';

import { filesStream } from '../1-B-git-enriched-streams/files';

import { flatFilesCsv } from './repo-coupling-report';
import { fileTuplesDict } from '../1-C-aggregate-in-memory/repo-coupling-aggregate';

describe(`flatFilesCsv`, () => {
    it(`generate an array of strings, each representing one file in a specific tuple, in csv format`, (done) => {
        const logName = 'a-git-repo';
        const logFilePath = path.join(process.cwd(), `/test-data/output/${logName}-commits.gitlog`);
        const clocLogPath = path.join(process.cwd(), `/test-data/output/${logName}-cloc.gitlog`);

        const timeWindowLengthInDays = 1;
        const fileTupleDict = fileTuplesDict(
            [filesStream(logFilePath, clocLogPath), filesStream(logFilePath, clocLogPath)],
            timeWindowLengthInDays,
        );

        fileTupleDict
            .pipe(
                flatFilesCsv(),
                toArray(),
                tap({
                    next: (fileTuplesCsv) => {
                        // there are 9 tuples, each containing 2 files, plus the first line (the header)
                        expect(fileTuplesCsv.length).equal(19);
                    },
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(20000);
});
