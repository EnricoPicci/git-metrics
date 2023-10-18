"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ignoreUpTo = void 0;
const rxjs_1 = require("rxjs");
/**
 * Returns an operator function that filters the input Observable to only include lines of text
 * that come after the line that includes the specified start token.
 * @param startToken The start token to look for in the input stream.
 * @returns An operator function that filters the input Observable.
 */
function ignoreUpTo(startToken) {
    return (source) => {
        return new rxjs_1.Observable((subscriber) => {
            let startOutput = false;
            const subscription = source.subscribe({
                next: (line) => {
                    startOutput = startOutput || line.includes(startToken);
                    if (startOutput) {
                        subscriber.next(line);
                    }
                },
                error: (err) => subscriber.error(err),
                complete: () => {
                    subscriber.complete();
                },
            });
            return () => {
                subscription.unsubscribe();
            };
        });
    };
}
exports.ignoreUpTo = ignoreUpTo;
//# sourceMappingURL=ignore-up-to.js.map