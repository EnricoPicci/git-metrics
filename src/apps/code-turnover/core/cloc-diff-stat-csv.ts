import { ClocDiffLanguageStats } from '../../../cloc-functions/cloc-diff.model';

export function clocDiffStatToCsvWithBase(
    clocDiffStat: {
        same: ClocDiffLanguageStats;
        modified: ClocDiffLanguageStats;
        added: ClocDiffLanguageStats;
        removed: ClocDiffLanguageStats;
    },
    base: any,
) {
    const { repoPath, leastRecentCommit, mostRecentCommit } = base;
    let sameFlat: clocDiffRec[] = [];
    // no warning is needed if there are no same stats since stats may be undefined to reduce the size of the output
    if (clocDiffStat.same) {
        sameFlat = Object.entries(clocDiffStat.same)
            .map(([language, clocStats]) => {
                return Object.entries(clocStats)
                    .map(([stat, value]) => {
                        // stats for the "same" case can never be the result of a cut and paste
                        return { ...base, diffType: 'same', language, stat, value, possibleCutPaste: false };
                    })
                    .flat();
            })
            .flat();
    }
    let addedFlat: clocDiffRec[] = [];
    if (clocDiffStat.added) {
        addedFlat = Object.entries(clocDiffStat.added)
            .map(([language, clocStats]) => {
                // if the clocStat is marked as possible cut and paste, then this record could be the result of a cut and paste
                // in particular, since we are in the "added" case, this record could represent the paste
                const possibleCutPaste = clocStats.possibleCutPaste;
                // delete the possibleCutPaste property from the clocStats object since we are going to copy it to the csv record
                delete clocStats.possibleCutPaste;
                return Object.entries(clocStats)
                    .map(([stat, value]) => {
                        return { ...base, diffType: 'added', language, stat, value, possibleCutPaste };
                    })
                    .flat();
            })
            .flat();
    } else {
        console.warn(`!!!!!!!!! No ADDED stats for ${repoPath}
            with commits ${leastRecentCommit} and ${mostRecentCommit}`);
    }
    let removedFlat: clocDiffRec[] = [];
    if (clocDiffStat.removed) {
        removedFlat = Object.entries(clocDiffStat.removed)
            .map(([language, clocStats]) => {
                // if the clocStat is marked as possible cut and paste, then this record could be the result of a cut and paste
                // in particular, since we are in the "removed" case, this record could represent the cut
                const possibleCutPaste = clocStats.possibleCutPaste;
                // delete the possibleCutPaste property from the clocStats object since we are going to copy it to the csv record
                delete clocStats.possibleCutPaste;
                return Object.entries(clocStats)
                    .map(([stat, value]) => {
                        return { ...base, diffType: 'removed', language, stat, value, possibleCutPaste };
                    })
                    .flat();
            })
            .flat();
    } else {
        console.warn(`!!!!!!!!! No REMOVED stats for ${repoPath}
            with commits ${leastRecentCommit} and ${mostRecentCommit}`);
    }
    let modifiedFlat: clocDiffRec[] = [];
    if (clocDiffStat.modified) {
        modifiedFlat = Object.entries(clocDiffStat.modified)
            .map(([language, clocStats]) => {
                return Object.entries(clocStats)
                    .map(([stat, value]) => {
                        // stat representing modifications can never be the result of a cut and paste
                        return { ...base, diffType: 'modified', language, stat, value, possibleCutPaste: false };
                    })
                    .flat();
            })
            .flat();
    } else {
        console.warn(`!!!!!!!!! No MODIFIED stats for ${repoPath}
            with commits ${leastRecentCommit} and ${mostRecentCommit}`);
    }
    const csvRecords = [...sameFlat, ...addedFlat, ...removedFlat, ...modifiedFlat];
    return csvRecords;
}

type clocDiffRec = {
    diffType: string;
    language: string;
    stat: string;
    value: any;
    repoPath: string;
    yearMonth: string;
    leastRecentCommit: string | undefined;
    moreRecentCommit: string | undefined;
};
