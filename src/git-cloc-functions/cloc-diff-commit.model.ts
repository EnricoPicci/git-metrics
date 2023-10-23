import { ClocDiffByfileWithCommitData } from "../cloc-functions/cloc-diff-byfile.model";
import { ClocFileInfo } from "../cloc-functions/cloc.model";
import { CommitCompactWithUrlAndParentDate } from "../git-functions/commit.model";

export type ClocDiffCommitEnriched = ClocDiffByfileWithCommitData & ClocFileInfo & CommitCompactWithUrlAndParentDate

export type ClocDiffCommitEnrichedWithDerivedData = ClocDiffCommitEnriched & {
    date_month: string;
    commit_code_turnover: number;
    file_code_turnover: number;
    days_span: number;
    maybe_mass_refact: boolean;
    explain_mass_refact: string;
    maybe_generated: boolean;
    explain_generated: string;
}