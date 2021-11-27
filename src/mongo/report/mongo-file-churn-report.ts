import { map, tap, concatMap } from 'rxjs/operators';
import {
    addConsiderationsForFileChurnReport,
    FileChurnReport,
    FileChurnReportParams,
    fileChurnReportCore,
} from '../../reports/file-churn-report';
import { fileChurn } from '../query/file-churn-query';
import { mongoProjectInfo } from './mongo-add-prj-info';
import { addProjectInfo } from '../../reports/add-project-info';
import { ProjectInfo } from '../../aggregate-types/project-info';
import { cleanParamsForReport, MongoReportParams } from './mongo-report';

export type MongoFileChurnReportParams = {
    // for this type of report the files collection is mandatory
    filesCollection: string;
} & MongoReportParams &
    FileChurnReportParams;
export type MongoFileChurnReport = {
    params: { val?: MongoFileChurnReportParams; description: string };
} & FileChurnReport;

// produce a report about file churn and general project info reading from a mongo db (previously loaded with commit and files info)
// reads also from the repo folder for information about the files currently in the project
export function mongoFileChurnReportWithProjectInfo(params: MongoFileChurnReportParams, csvFilePath?: string) {
    return mongoProjectInfo(params).pipe(concatMap((prjInfo) => mongoFileChurnReport(params, prjInfo, csvFilePath)));
}

export function mongoFileChurnReport(
    params: MongoFileChurnReportParams,
    projectInfo: ProjectInfo,
    csvFilePath?: string,
) {
    return _mongoFileChurnReport(params, csvFilePath).pipe(
        tap((report: MongoFileChurnReport) => {
            addProjectInfo(report, projectInfo, csvFilePath);
        }),
        map((report) => cleanParamsForReport(report) as MongoFileChurnReport),
        map((report) => addConsiderationsForFileChurnReport(report) as MongoFileChurnReport),
    );
}

// exported only to allow the tests
// produce a report about file churn reading from a mongo db (previously loaded with files info)
export function _mongoFileChurnReport(params: MongoFileChurnReportParams, csvFilePath?: string) {
    const fileChurnSource = fileChurn(params.connectionString, params.dbName, params.filesCollection, params.after);
    return fileChurnReportCore(fileChurnSource, params, csvFilePath);
}
