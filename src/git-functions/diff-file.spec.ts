import { tap } from "rxjs";
import { diff$ } from "./diff-file";
import { expect } from "chai";

// 25      25      dist / apps / code - turnover / internals / repos -with-commits - by - month.functions.spec.js
// 1       1       dist / apps / code - turnover / internals / repos -with-commits - by - month.functions.spec.js.map
// 0       2       dist / cloc - functions / cloc - diff - byfile.model.js
// 1       1       dist / cloc - functions / cloc - diff - byfile.model.js.map
// 0       2       dist / cloc - functions / cloc - diff - byfile.spec.js
// 1       1       dist / cloc - functions / cloc - diff - byfile.spec.js.map
// 5       3       dist / git - functions / commit.js
// 1       1       dist / git - functions / commit.js.map
// 1       1       dist / git - functions / commit.model.js.map
// 1       1       dist / git - functions / commit.spec.js
// 1       1       dist / git - functions / commit.spec.js.map
// 69      69      src / apps / code - turnover / internals / commit - monthly - pair.functions.spec.ts
// 10      10      src / apps / code - turnover / internals / commits - by - month.functions.spec.ts
// 25      25      src / apps / code - turnover / internals / repos -with-commits - by - month.functions.spec.ts
// 0       5       src / cloc - functions / cloc - diff - byfile.model.ts
// 0       2       src / cloc - functions / cloc - diff - byfile.spec.ts
// 1       0       src / git - functions / commit.model.ts
// 1       1       src / git - functions / commit.spec.ts
// 5       3       src / git - functions / commit.ts
describe('diff$', () => {
    it('should a list of diffs between one commit of this repo and its parent', (done) => {
        const repoPath = './';
        const commit = '068444ab6f767b5b45b06d4383b2cf8c0e451e94';
        const parentCommit = `${commit}^1`;
        diff$(commit, parentCommit, repoPath).pipe(
            tap((diffs) => {
                expect(diffs.length).equal(23);
            })
        ).subscribe({
            error: (err) => done(err),
            complete: () => done()
        });
    });
});