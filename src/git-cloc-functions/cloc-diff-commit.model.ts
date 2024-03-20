import { ClocDiffByfileWithCommitData, ClocDiffByfileWithIsCopy } from "../cloc-functions/cloc-diff-byfile.model";
import { ClocFileInfo } from "../cloc-functions/cloc.model";
import { CommitCompactWithUrlAndParentDate } from "../git-functions/commit.model";
import { ExecuteCommandObsOptions } from "../tools/execute-command/execute-command";

export type ClocDiffCommitEnriched = ClocDiffByfileWithCommitData & ClocFileInfo & CommitCompactWithUrlAndParentDate

export type ClocDiffCommitBetweenDatesEnriched = ClocDiffByfileWithIsCopy & {
    language: string;
    file: string;
    from_blank: number;
    from_comment: number;
    from_code: number
    from_sha: string;
    from_sha_date: string;
    to_blank: number;
    to_comment: number;
    to_code: number
    to_sha: string;
    to_sha_date: string;
    repo: string;
    module: string;
    area: string;
}

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
    // the path to a csv file that contains the date of the creation of the repos - if this date is subsequent to the 
    // start date of the analysis (contained in the from parameter), then the creation date is used as the start date
    // this is useful in case of forked repos - if we want to analyze the code turnover of a forked repo, we may want to
    // consider the code turnover only after the fork date
    // the csv file must have the following fields:
    // - either 'http_url_to_repo' or 'ssh_url_to_repo' or both: the url to the repo on the "origin" git server which represents the key of the repo
    // - created_at: the date of creation of the repo`
    creationDateCsvFilePath?: string;
    notMatchDirectories?: string[];
    languages?: string[],
} & ExecuteCommandObsOptions;