import { map, tap, share, concatMap } from 'rxjs/operators';
import {
    addConsiderationsForAuthorChurnReport,
    AuthorChurnReport,
    AuthorChurnReportParams,
    authorChurnReportCore,
} from '../../1-D-reports/author-churn-report';
import { authorChurn } from '../query/author-churn-query';
import { mongoProjectInfo } from './mongo-add-prj-info';
import { addProjectInfo } from '../../1-D-reports/add-project-info';
import { ProjectInfo } from '../../1-C-aggregate-types/project-info';
import { cleanParamsForReport, MongoReportParams } from './mongo-report';

export type MongoAuthorChurnReportParams = {
    // for this type of report the files and commits collections are mandatory
    filesCollection: string;
    commitsCollection: string;
} & MongoReportParams &
    AuthorChurnReportParams;
export type MongoAuthorChurnReport = {
    params: { val?: MongoAuthorChurnReportParams; description: string };
} & AuthorChurnReport;

// produce a report about author churn and general project info reading from a mongo db (previously loaded with commit and files info)
// reads also from the repo folder for information about the files currently in the project
export function mongoAuthorChurnReportWithProjectInfo(params: MongoAuthorChurnReportParams, csvFilePath?: string) {
    return mongoProjectInfo(params).pipe(concatMap((prjInfo) => mongoAuthorChurnReport(params, prjInfo, csvFilePath)));
}
export function mongoAuthorChurnReport(
    params: MongoAuthorChurnReportParams,
    projectInfo: ProjectInfo,
    csvFilePath?: string,
) {
    return _mongoAuthorChurnReport(params, csvFilePath).pipe(
        tap((report: MongoAuthorChurnReport) => addProjectInfo(report, projectInfo, csvFilePath)),
        map((report) => cleanParamsForReport(report) as MongoAuthorChurnReport),
        map((report) => addConsiderationsForAuthorChurnReport(report) as MongoAuthorChurnReport),
    );
}

// exported only to allow the tests
// produce a report about author churn reading from a mongo db (previously loaded with files info)
export function _mongoAuthorChurnReport(params: MongoAuthorChurnReportParams, csvFilePath?: string) {
    const authorChurnSource = authorChurn(
        params.connectionString,
        params.dbName,
        params.filesCollection,
        params.commitsCollection,
        params.after,
    ).pipe(share());
    return authorChurnReportCore(authorChurnSource, params, csvFilePath);
}
