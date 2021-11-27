"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCurrentBranchTips = exports.addBranchTips = void 0;
const rxjs_1 = require("rxjs");
function addBranchTips() {
    let currentBranchTips = [];
    return (0, rxjs_1.pipe)((0, rxjs_1.map)((commit) => {
        const _parents = commit.parents;
        const { updatedBranchTips, isAdditionalBranchTip } = updateCurrentBranchTips(_parents, currentBranchTips, commit.hashShort);
        currentBranchTips = updatedBranchTips;
        return Object.assign(Object.assign({}, commit), { branchTips: [...updatedBranchTips], isAdditionalBranchTip });
    }));
}
exports.addBranchTips = addBranchTips;
// If the parent(s) are in the list of current branch tips, remove them and subsitute them with the new commit as tip
// Otherwise if the parent(s) are not present, add the commit as a new tip and return true
// exported only for testing purpose
function updateCurrentBranchTips(parents, branchTips, newBranchHash) {
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
exports.updateCurrentBranchTips = updateCurrentBranchTips;
//# sourceMappingURL=commits-and-branch-tips.js.map