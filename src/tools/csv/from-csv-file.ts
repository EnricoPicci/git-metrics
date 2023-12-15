
import { map } from "rxjs";

import { fromCsvArray } from "@enrico.piccinin/csv-tools";
import { readLinesObs } from "observable-fs";

export function fromCsvFile$<T = any>(filePath: string, separator = ',') {
    return readLinesObs(filePath).pipe(
        map(lines => fromCsvArray<T>(lines, separator))
    )
}