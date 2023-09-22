import { Report, ReportParams } from '../../1-D-reports/report';

export type MongoReportParams = {
    connectionString: string;
    dbName: string;
    commitsCollection?: string;
    filesCollection?: string;
} & ReportParams;

export type MongoReport = {
    params: { val?: MongoReportParams; description: string };
} & Report;

export function cleanParamsForReport(report: MongoReport) {
    const cleanParams = { ...report.params.val } as MongoReportParams;
    const cleanConnectionString = report.params.val.connectionString.split('//')[1];
    cleanParams.connectionString = cleanConnectionString;
    report.params.val = cleanParams;
    return report as MongoReport;
}
