// tests that the results in diffent reports are consistent
// for instance that the chrn in the file churn report is the same as the sum of the churns in the author churn report
import { expect } from 'chai';
import path from 'path';
import { forkJoin, tap } from 'rxjs';
import { authorChurn } from '../1-C-aggregate-in-memory/author-churn-aggregate';
import { gitCommitStream } from '../1-B-git-enriched-streams/commits';
import { authorChurnReportCore, AuthorChurnReportParams } from './author-churn-report';
import { filesStream } from '../1-B-git-enriched-streams/files';
import { fileChurn } from '../1-C-aggregate-in-memory/file-churn-aggregate';
import { fileChurnReportCore, FileChurnReportParams } from './file-churn-report';

describe(`fileChurnReport compare with authorChurnReport`, () => {
    it(`Generates the reports and chacks that the total churn is the same. The churn is the same because it considers
    only the commits after a certain data and all the files after that date are present in the current project 
    and therefore in the cloc log.`, (done) => {
        const repoName = 'kafka-commits-reverse-1.gitlog';

        const commitLogPath = path.join(process.cwd(), `/test-data/output/${repoName}`);
        const clocLogPath = path.join(process.cwd(), `/test-data/output/kafka-cloc.csv`);
        const outDir = `${process.cwd()}/temp`;
        const after = new Date('2021-01-01');

        // build the file churn report
        const fileCommits = filesStream(commitLogPath, clocLogPath);
        const fileChurns = fileChurn(fileCommits, true, after);
        const fParams: FileChurnReportParams = {
            commitLog: commitLogPath,
            outDir,
        };
        const fChurnReport = fileChurnReportCore(fileChurns, fParams);

        // build the author churn report
        const commits = gitCommitStream(commitLogPath);
        const authorChurns = authorChurn(commits, after);
        const params: AuthorChurnReportParams = {
            commitLog: commitLogPath,
            outDir,
        };
        const authChurnReport = authorChurnReportCore(authorChurns, params);

        forkJoin([fChurnReport, authChurnReport])
            .pipe(
                tap((reports) => {
                    const fReport = reports[0];
                    const aReport = reports[1];
                    expect(fReport.totChurn.val).equal(aReport.totChurn.val);
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(200000);

    it(`Generates the reports and verifies that the total churn for authorChurnReport is greater than the one for fileChurnReport. 
    The churn is the different because it considers all the commits and the files in the first commit are no longer 
    present in the current project and therefore they are not present in the cloc log.
    Since only the files with cloc > 0 are considered for the fileChurnReport, the files in the first commit are not
    considered for this report, hence the difference.`, (done) => {
        const repoName = 'kafka-commits-reverse-1.gitlog';

        const commitLogPath = path.join(process.cwd(), `/test-data/output/${repoName}`);
        const clocLogPath = path.join(process.cwd(), `/test-data/output/kafka-cloc.csv`);
        const outDir = `${process.cwd()}/temp`;

        // build the file churn report
        const fileCommits = filesStream(commitLogPath, clocLogPath);
        const fileChurns = fileChurn(fileCommits, true);
        const fParams: FileChurnReportParams = {
            commitLog: commitLogPath,
            outDir,
        };
        const fChurnReport = fileChurnReportCore(fileChurns, fParams);

        // build the author churn report
        const commits = gitCommitStream(commitLogPath);
        const authorChurns = authorChurn(commits);
        const params: AuthorChurnReportParams = {
            commitLog: commitLogPath,
            outDir,
        };
        const authChurnReport = authorChurnReportCore(authorChurns, params);

        forkJoin([fChurnReport, authChurnReport])
            .pipe(
                tap((reports) => {
                    const fReport = reports[0];
                    const aReport = reports[1];
                    expect(fReport.totChurn.val).lt(aReport.totChurn.val);
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(200000);

    it(`Generates the reports and verifies that the total churn for authorChurnReport is equal to the one for fileChurnReport. 
    The churn is the the same because fileChurnReport considers also the files with cloc zero.
    Therefore also the churn of the files that are not currently in the project is considered, which is the same logic
    applied when calculating the authorChurnReport`, (done) => {
        const repoName = 'kafka-commits-reverse-1.gitlog';

        const commitLogPath = path.join(process.cwd(), `/test-data/output/${repoName}`);
        const clocLogPath = path.join(process.cwd(), `/test-data/output/kafka-cloc.csv`);
        const outDir = `${process.cwd()}/temp`;

        const ignoreClocZero = false;

        // build the file churn report
        const fileCommits = filesStream(commitLogPath, clocLogPath);
        const fileChurns = fileChurn(fileCommits, ignoreClocZero);
        const fParams: FileChurnReportParams = {
            commitLog: commitLogPath,
            outDir,
        };
        const fChurnReport = fileChurnReportCore(fileChurns, fParams);

        // build the author churn report
        const commits = gitCommitStream(commitLogPath);
        const authorChurns = authorChurn(commits);
        const params: AuthorChurnReportParams = {
            commitLog: commitLogPath,
            outDir,
        };
        const authChurnReport = authorChurnReportCore(authorChurns, params);

        forkJoin([fChurnReport, authChurnReport])
            .pipe(
                tap((reports) => {
                    const fReport = reports[0];
                    const aReport = reports[1];
                    expect(fReport.totChurn.val).equal(aReport.totChurn.val);
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(200000);
});
