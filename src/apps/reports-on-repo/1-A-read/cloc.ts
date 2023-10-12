import path = require('path');
import {
    concatMap,
    map,
    from,
} from 'rxjs';

import { clocSummary$ } from '../../../cloc-functions/cloc';
import { ClocParams } from '../../../cloc-functions/cloc-params';
import { buildOutfileName } from '../../../git-functions/utils/file-name-utils';

// runs the cloc command and returns an Observable which is the stream of lines output of the cloc command execution
export function clocSummaryAsStreamOfStrings$(
    params: ClocParams,
    outFile?: string,
    vcs?: string,
) {
    return clocSummary$(params.folderPath, vcs, outFile).pipe(
        concatMap(stats => from(stats)),
        map(stat => `${stat.nFiles},${stat.language},${stat.blank},${stat.comment},${stat.code}`),
    )
}

export function buildSummaryClocOutfile(params: ClocParams) {
    const outDir = params.outDir ? params.outDir : './';
    const outFile = buildOutfileName(params.outClocFile!, params.folderPath, params.outClocFilePrefix, '-cloc-summary.csv');
    const out = path.resolve(path.join(outDir, outFile));
    return out;
}
