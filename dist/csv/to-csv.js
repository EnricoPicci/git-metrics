"use strict";
// Custom operator which uses the data notified with the first notification to build the header, which is then emitted first.
// Then all other notifications of the source Observable are notified.
// https://rxjs.dev/guide/operators#creating-new-operators-from-scratch
Object.defineProperty(exports, "__esModule", { value: true });
exports.toCsvObs = exports.toCsv = void 0;
const rxjs_1 = require("rxjs");
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toCsv(objects) {
    const csvLines = [];
    if (objects.length < 1) {
        throw new Error(`An array with at least one element is expected`);
    }
    const header = objects[0];
    csvLines.push(Object.keys(header).join(','));
    objects.forEach((obj) => csvLines.push(Object.values(obj).join(',')));
    return csvLines;
}
exports.toCsv = toCsv;
function toCsvObs() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (source) => {
        let isFirst = true;
        return new rxjs_1.Observable((subscriber) => {
            const subscription = source.subscribe({
                next: (obj) => {
                    if (isFirst) {
                        isFirst = false;
                        subscriber.next(Object.keys(obj).join(','));
                    }
                    subscriber.next(Object.values(obj).join(','));
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
exports.toCsvObs = toCsvObs;
//# sourceMappingURL=to-csv.js.map