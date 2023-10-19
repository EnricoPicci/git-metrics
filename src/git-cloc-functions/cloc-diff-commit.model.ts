import { ClocDiffByfile } from "../cloc-functions/cloc-diff-byfile.model";
import { ClocFileInfo } from "../cloc-functions/cloc.model";
import { CommitCompactWithParentDate } from "../git-functions/commit.model";

export type ClocDiffCommitEnriched = ClocDiffByfile & ClocFileInfo & CommitCompactWithParentDate 