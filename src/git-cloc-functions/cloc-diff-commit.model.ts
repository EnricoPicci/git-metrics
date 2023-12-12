import { ClocDiffByfileWithCommitData } from "../cloc-functions/cloc-diff-byfile.model";
import { ClocFileInfo } from "../cloc-functions/cloc.model";
import { CommitCompactWithUrlAndParentDate } from "../git-functions/commit.model";

export type ClocDiffCommitEnriched = ClocDiffByfileWithCommitData & ClocFileInfo & CommitCompactWithUrlAndParentDate

export type ClocDiffCommitEnrichedWithDerivedData = ClocDiffCommitEnriched & {
    module: string;
    year_month: string;
    commit_code_turnover: number;
    file_code_turnover: number;
    commit_code_turnover_no_removed_lines: number;
    file_code_turnover_no_removed_lines: number;
    days_span: number;
    maybe_mass_refact: boolean;
    explain_mass_refact: string;
    maybe_generated: boolean;
    explain_generated: string;
    massive_remove: boolean;
    jira_id: string;
}

export type ClocDiffWithCommitOptions = {
    fileMassiveRefactorThreshold?: number;
    commitMassiveRefactorThreshold?: number;
    commitMassiveRemoveThreshold?: number;
    jiraIdExtractor?: (commit: ClocDiffCommitEnriched) => string | undefined;
    // a regex pattern to extract the Jira ID from the commit subject - it can be passed as a command line option
    // if jiraIdExtractor is specified, then this option is ignored
    jiraIdRegexPattern?: string;
};