// Functions to transform an array of objects to an array of csv lines

import { Observable, Subscriber } from 'rxjs';
import { DEFAUL_CONFIG } from '../../apps/reports-on-repo/0-config/config';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toCsv(objects: any[]) {
    const csvLines: string[] = [];
    if (objects.length < 1) {
        return [] as string[];
    }
    const header = objects[0];
    csvLines.push(Object.keys(header).join(DEFAUL_CONFIG.CSV_SEP));
    objects.forEach((obj) => csvLines.push(valuesWithNoCsvSeparator(obj).join(DEFAUL_CONFIG.CSV_SEP)));
    return csvLines;
}

// Custom operator which uses the first object notified by upstream to build the header, which is then emitted first.
// All objects notified by the source Observable are transformed to csv records and notified downstream.
// https://rxjs.dev/guide/operators#creating-new-operators-from-scratch
export function toCsvObs() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (source: Observable<any>) => {
        let isFirst = true;
        return new Observable((subscriber: Subscriber<string>) => {
            const subscription = source.subscribe({
                next: (obj) => {
                    if (isFirst) {
                        isFirst = false;
                        subscriber.next(Object.keys(obj).join(DEFAUL_CONFIG.CSV_SEP));
                    }
                    subscriber.next(valuesWithNoCsvSeparator(obj).join(DEFAUL_CONFIG.CSV_SEP));
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

// valuesWithNoCsvSeparator returns an array of values of the object, with the csv separator replaced by space if present
// this is to avoid the csv parser to split the value in two columns
function valuesWithNoCsvSeparator(obj: Record<string, string>) {
    return Object.values(obj).map((value) => {
        return typeof value === 'string' ? value.replace(DEFAUL_CONFIG.CSV_SEP, ' ') : value;
    });
}
