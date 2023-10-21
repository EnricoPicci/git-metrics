import { ClocDiffByfileWithCommitDiffs } from "../cloc-functions/cloc-diff-byfile.model";
import { ClocFileInfo } from "../cloc-functions/cloc.model";
import { CommitCompactWithUrlAndParentDate } from "../git-functions/commit.model";

export type ClocDiffCommitEnriched = ClocDiffByfileWithCommitDiffs & ClocFileInfo & CommitCompactWithUrlAndParentDate

export type ClocDiffCommitEnrichedWithDerivedData = ClocDiffCommitEnriched & {
    commit_code_turnover: number;
    file_code_turnover: number;
    days_span: number;
    maybe_cut_paste?: boolean;
    maybe_mass_refact: boolean;
    explain_mass_refact: string;
    maybe_generated: boolean;
    explain_generated: string;
}