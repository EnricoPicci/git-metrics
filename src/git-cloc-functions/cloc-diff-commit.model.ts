import { ClocDiffByfileWithCommitDiffs } from "../cloc-functions/cloc-diff-byfile.model";
import { ClocFileInfo } from "../cloc-functions/cloc.model";
import { CommitCompactWithParentDate } from "../git-functions/commit.model";

export type ClocDiffCommitEnriched = ClocDiffByfileWithCommitDiffs & ClocFileInfo & CommitCompactWithParentDate 