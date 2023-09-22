import { map, pipe } from 'rxjs';
import { GitCommitEnriched, GitCommitEnrichedWithBranchTips } from '../1-B-git-enriched-types/git-types';

export function commitWithBranchTips() {
    return pipe(addBranchTips());
}

export function addBranchTips() {
    let currentBranchTips: any[] = [];
    return pipe(
        map((commit: GitCommitEnriched) => {
            const _parents = commit.parents;
            const isMerge = _parents.length > 1;
            const { updatedBranchTips, isAdditionalBranchTip } = updateCurrentBranchTips(
                _parents,
                currentBranchTips,
                commit.hashShort,
            );
            currentBranchTips = updatedBranchTips;
            return {
                ...commit,
                branchTips: [...updatedBranchTips],
                isAdditionalBranchTip,
                isMerge,
            } as GitCommitEnrichedWithBranchTips;
        }),
    );
}

// If the parent(s) are in the list of current branch tips, remove them and subsitute them with the new commit as tip
// Otherwise if the parent(s) are not present, add the commit as a new tip and return true
// exported only for testing purpose
export function updateCurrentBranchTips(parents: string[], branchTips: string[], newBranchHash: string) {
    // if the new commit does not remove one parent from the list of currentBranchTips to substitute this, then the commit is
    // becoming an additional tip in the currentBranchTips
    let isAdditionalBranchTip = true;
    parents.forEach((p) => {
        const index = branchTips.indexOf(p);
        if (index > -1) {
            isAdditionalBranchTip = false;
            branchTips.splice(index, 1);
        }
    });
    branchTips.push(newBranchHash);
    return { updatedBranchTips: branchTips, isAdditionalBranchTip };
}
