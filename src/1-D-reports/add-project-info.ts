import { ProjectInfo } from '../1-C-aggregate-types/project-info';
import { Report } from './report';

export function addProjectInfo(report: Report, prjInfo: ProjectInfo, csvFilePath: string) {
    report.clocSummary.val = prjInfo.clocSummaryInfo;
    report.totCommits.val = prjInfo.commits.count;
    report.firstCommitDate.val = prjInfo.commits.first.committerDate;
    report.lastCommitDate.val = prjInfo.commits.last.committerDate;
    report.csvFile.val = csvFilePath;
    console.log(`====>>>> GENERAL PROJECT INFO ADDED TO REPORT ${report.description}`);
}
