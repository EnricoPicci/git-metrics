"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.splitCommits = void 0;
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const observable_fs_1 = require("observable-fs");
const read_git_1 = require("./read-git");
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
// Splits the content of a git log into single commits. Each commit is in the form of CommitDoc
function splitCommits(logFilePath) {
    return (0, observable_fs_1.readLineObs)(logFilePath).pipe((0, operators_1.filter)((line) => line.length > 0), _splitCommit(logFilePath));
}
exports.splitCommits = splitCommits;
// Custom operator which splits the content of a git log into buffers of lines whereeach buffer contains all the info
// relative to a single git commit
// https://rxjs.dev/guide/operators#creating-new-operators-from-scratch
function _splitCommit(logFilePath) {
    return (source) => {
        return new rxjs_1.Observable((subscriber) => {
            let buffer;
            const subscription = source.subscribe({
                next: (line) => {
                    const isStartOfBuffer = line.length > 0 && line.slice(0, read_git_1.SEP.length) === read_git_1.SEP;
                    if (isStartOfBuffer) {
                        if (buffer) {
                            subscriber.next(buffer);
                        }
                        buffer = [];
                    }
                    buffer.push(line);
                },
                error: (err) => subscriber.error(err),
                complete: () => {
                    if (!buffer) {
                        subscriber.error(`!!!!!!!!!!!!! >>>>  No commits found in file ${logFilePath}`);
                    }
                    subscriber.next(buffer);
                    subscriber.complete();
                },
            });
            return () => {
                subscription.unsubscribe();
            };
        });
    };
}
// ALTERNATIVE VERSION
// This is an alternative version of the above function which does use only rxJs operators and not custom operators
//
// export function splitCommits(logFilePath: string) {
//     let buffer: string[] = [];
//     const lastCommit = new Subject<Array<string>>();
//     const _commits = readLineObs(logFilePath).pipe(
//         filter((line) => line.length > 0),
//         map((line) => {
//             if (line.slice(0, SEP.length) === SEP) {
//                 const commit = buffer;
//                 buffer = [line];
//                 return commit;
//             }
//             buffer.push(line);
//             return null;
//         }),
//         filter((buffer) => !!buffer),
//         tap({
//             complete: () => {
//                 lastCommit.next(buffer);
//                 lastCommit.complete();
//             },
//         }),
//         skip(1),
//     );
//     return merge(_commits, lastCommit);
// }
//# sourceMappingURL=commits.js.map