import { CommitDiffStats } from "../code-turnover/core/code-turnover.model";

export type CommitDiffStatsWithSummaryReport = CommitDiffStats & { summaryReportPath: string };