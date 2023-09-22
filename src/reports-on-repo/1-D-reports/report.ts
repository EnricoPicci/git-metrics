export type ReportParams = {
    repoFolderPath?: string;
    outDir: string;
    after?: Date;
    before?: Date;
    outFilePrefix?: string;
    commitLog?: string;
    clocDefsPath?: string;
    filter?: string[];
};

export class Report {
    name: string;
    description: string;
    date: { val: Date; description: string } = { val: new Date(), description: `Date of the report run` };
    params: { val: ReportParams; description: string } = {
        description: `Parameters used to run the query that feeds the report`,
        val: { outDir: '' },
    };
    clocSummary: { val: string[]; description: string } = {
        description: `Summary of cloc run on the repor folder in csv format`,
        val: [],
    };
    totCommits: { val: number; description: string } = {
        description: `Total number of commits`,
        val: 0,
    };
    firstCommitDate: { val: Date; description: string } = {
        description: `Date of the first commit`,
        val: new Date(),
    };
    lastCommitDate: { val: Date; description: string } = {
        description: `Date of the last commit`,
        val: new Date(),
    };
    csvFile: { val: string; description: string } = {
        description: `Path to the csv file that contains the detailed data of the report`,
        val: '',
    };
    considerations: string[] = [];
    constructor(_params: ReportParams, name: string, description: string) {
        _params.outDir = _params.outDir ? _params.outDir : process.cwd();
        this.params.val = _params;
        this.name = name;
        this.description = description;
    }

    addConsiderations(): Report {
        throw new Error('to be implemented');
    }
}

export function addConsiderationsHeader(r: Report) {
    addConsideration(r, `Report: ${r.description}`);
    addConsideration(r, `Run: ${r.date.val}`);
    addConsideration(r, `Parameters used:`);
    addConsideration(r, `${JSON.stringify(r.params.val)}`);
    if (r.csvFile) {
        addConsideration(r, `Report data saved in file ${r.csvFile.val}`);
    }
}

export function addProjectInfoConsiderations(reports: Report[]) {
    const r = reports[0];
    const generalProjectReport = new Report(r.params.val, `GENERAL PROJECT INFORMATION`, `GENERAL PROJECT INFORMATION`);
    addConsideration(generalProjectReport, `GENERAL PROJECT INFORMATION`);
    addConsideration(generalProjectReport, `Project folder: ${r.params.val.repoFolderPath}`);
    addConsideration(generalProjectReport, `cloc summary:`);
    r.clocSummary?.val.forEach((csvLine) => addConsideration(generalProjectReport, clocLineAsTableRow(csvLine)));
    addConsideration(generalProjectReport, `Number of commits: ${r.totCommits.val}`);
    addConsideration(generalProjectReport, `First commit: ${r.firstCommitDate.val}`);
    addConsideration(generalProjectReport, `Last commit: ${r.lastCommitDate.val}`);
    return [generalProjectReport, ...reports];
}

export function addConsideration(r: Report, consideration: string) {
    r.considerations.push(consideration);
}

export function filterMessage(filter: string[]) {
    return filter ? `(filtered for "${filter.join(' ')}")` : '';
}

// calculate the number of files or authors that contribute to reach a certain threshold of churn
// assumes that the array of churnInfo is ordered in decreasing order for the 'linesAddDel' property
export function topChurnContributors<T extends { linesAddDel: number }>(
    churnInfo: T[],
    threshold: number,
    totChurn: number,
) {
    let _accumulatedChurn = 0;
    const contributors: T[] = [];
    for (let i = 0; _accumulatedChurn / totChurn < threshold / 100; i++) {
        _accumulatedChurn = _accumulatedChurn + churnInfo[i].linesAddDel;
        contributors.push(churnInfo[i]);
    }
    return contributors;
}

function clocLineAsTableRow(csvLine: string) {
    return csvLine.split(',').join('\t');
}
