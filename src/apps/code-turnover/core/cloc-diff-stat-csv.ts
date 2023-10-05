import { ClocDiffLanguageStats } from '../../../cloc-functions/cloc-diff.model';

export function clocDiffStatToCsvWithBase(
    clocDiffStat: {
        same: ClocDiffLanguageStats;
        modified: ClocDiffLanguageStats;
        added: ClocDiffLanguageStats;
        removed: ClocDiffLanguageStats;
    },
    base: any,
    repoPath: string,
    leastRecentCommit: string,
    mostRecentCommit: string,
) {
    let sameFlat: clocDiffRec[] = [];
    if (!clocDiffStat) {
        console.warn('!!!!!!!!! No SAME stats for ${repoPath}');
    }
    if (clocDiffStat.same) {
        sameFlat = Object.entries(clocDiffStat.same)
            .map(([language, clocStats]) => {
                return Object.entries(clocStats)
                    .map(([stat, value]) => {
                        return { ...base, diffType: 'same', language, stat, value };
                    })
                    .flat();
            })
            .flat();
    } else {
        console.warn(`!!!!!!!!! No SAME stats for ${repoPath}
            with commits ${leastRecentCommit} and ${mostRecentCommit}`);
    }
    let addedFlat: clocDiffRec[] = [];
    if (clocDiffStat.added) {
        addedFlat = Object.entries(clocDiffStat.added)
            .map(([language, clocStats]) => {
                return Object.entries(clocStats)
                    .map(([stat, value]) => {
                        return { ...base, diffType: 'added', language, stat, value };
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
                return Object.entries(clocStats)
                    .map(([stat, value]) => {
                        return { ...base, diffType: 'removed', language, stat, value };
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
                        return { ...base, diffType: 'modified', language, stat, value };
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
