import { expect } from "chai";
import { commitsBetweenCommits$ } from "./commits-between-commits";
import { finalize, tap } from "rxjs";

describe(`commitsBetweenCommits$`, () => {
    it(`returns commits between 2 commits`, (done) => {
        const mostRecentCommit = 'HEAD';
        const leastRecentCommit = 'HEAD~1';
        commitsBetweenCommits$(mostRecentCommit, leastRecentCommit).pipe(
            tap((ret) => {
                expect(ret).not.undefined;
                expect(typeof ret).equal('string');
                expect(ret.length).gt(0);
            }),
            finalize(() => done())
        ).subscribe();
    });
});