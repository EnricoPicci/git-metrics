// Custom operator which uses the data notified with the first notification to build the header, which is then emitted first.
// Then all other notifications of the source Observable are notified.
// https://rxjs.dev/guide/operators#creating-new-operators-from-scratch

import { Observable, Subscriber } from 'rxjs';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toCsv(objects: any[]) {
    const csvLines: string[] = [];
    if (objects.length < 1) {
        throw new Error(`An array with at least one element is expected`);
    }
    const header = objects[0];
    csvLines.push(Object.keys(header).join(','));
    objects.forEach((obj) => csvLines.push(Object.values(obj).join(',')));
    return csvLines;
}

export function toCsvObs() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (source: Observable<any>) => {
        let isFirst = true;
        return new Observable((subscriber: Subscriber<string>) => {
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
