import { expect } from 'chai';
import { tap, toArray } from 'rxjs';
import { toYYYYMMDD } from '../0-tools/dates/date-functions';
import { filesStream } from './files';

const commitLogPath = `${process.cwd()}/test-data/output/a-git-repo-commits.gitlog`;
const clocLogPath = `${process.cwd()}/test-data/output/a-git-repo-cloc.gitlog`;

describe(`filesStream`, () => {
    it(`reads the commit and cloc info and generates a stream of FileDocs`, (done) => {
        filesStream(commitLogPath, clocLogPath)
            .pipe(
                tap({
                    next: (fileCommit) => {
                        expect(fileCommit).not.undefined;
                    },
                }),
                toArray(),
                tap({
                    next: (allFileCommits) => {
                        expect(allFileCommits.length).equal(7);
                        allFileCommits
                            .filter((f) => f.path === 'hallo.java')
                            .forEach((f) => expect(toYYYYMMDD(f.created)).equal('2019-09-22'));
                    },
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    });
});
