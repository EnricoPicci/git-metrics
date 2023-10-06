import { expect } from "chai";
import { reportsAndCodeTurnover } from "./code-turnover-and-reports.functions";
import { allReports } from "../reports-on-repo/2-pipelines/internals/run-reports-on-repo-core";
import { concatMap, tap } from "rxjs";
import { deleteFileObs } from "observable-fs";

describe('reportsAndCodeTurnover', () => {
    it(`should gnerate the reports and calculate the code-turnover for all repos contained in this project folder -
    since in this project folder there is only one repo (the project repo) the calculations are done only for
    this repo`, (done) => {
        const folderPath = '.';
        const outDir = './out';
        const languages = ['TypeScript'];
        const fromDate = new Date('2023-09-23');
        const toDate = new Date('2023-09-24');
        const concurrency = 1;
        const excludeRepoPaths: string[] = []
        const reports = allReports
        const filter = ['*.ts']
        const outFilePrefix = 'test'
        const clocDefsPath = ''
        const concurrentReadOfCommits = false
        const noRenames = false
        const ignoreClocZero = false

        reportsAndCodeTurnover(
            folderPath,
            fromDate,
            toDate,
            outDir,
            languages,
            concurrency,
            excludeRepoPaths,
            reports,
            filter,
            outFilePrefix,
            clocDefsPath,
            concurrentReadOfCommits,
            noRenames,
            ignoreClocZero,
        ).pipe(
            tap({
                next: data => {
                    expect(data.length).equal(2);
                    const summaryReportPath = data[0].summaryReportPath;
                    expect(summaryReportPath.includes('summary')).true
                },
            }),
            concatMap(data => {
                const summaryReportPath = data[0].summaryReportPath;
                return deleteFileObs(summaryReportPath);
            }),
        ).subscribe({
            error: err => {
                done(err);
            },
            complete: () => {
                done();
            }
        })
    }).timeout(200000);
});