import { map, tap, concatMap } from 'rxjs/operators';
import {
    addConsiderationsForFileAuthorsReport,
    FileAuthorsReport,
    FileAuthorsReportParams,
    fileAuthorsReportCore,
} from '../../1-D-reports/file-authors-report';
import { fileAuthors } from '../query/files-authors-query';
import { mongoProjectInfo } from './mongo-add-prj-info';
import { addProjectInfo } from '../../1-D-reports/add-project-info';
import { ProjectInfo } from '../../1-C-aggregate-types/project-info';
import { cleanParamsForReport, MongoReportParams } from './mongo-report';

export type MongoFileAuthorReportParams = {
    // for this type of report the files collection is mandatory
    filesCollection: string;
} & MongoReportParams &
    FileAuthorsReportParams;
export type MongoFileAuthorReport = {
    params: { val?: MongoFileAuthorReportParams; description: string };
} & FileAuthorsReport;

// produce a report about how many authors have contributed to a file and general project info
// reading from a mongo db (previously loaded with commit and files info).
// reads also from the repo folder for information about the files currently in the project
export function mongoFileAuthorReportWithProjectInfo(params: MongoFileAuthorReportParams, csvFilePath?: string) {
    return mongoProjectInfo(params).pipe(concatMap((prjInfo) => mongoFileAuthorReport(params, prjInfo, csvFilePath)));
}
export function mongoFileAuthorReport(
    params: MongoFileAuthorReportParams,
    projectInfo: ProjectInfo,
    csvFilePath?: string,
) {
    return _mongoFileAuthorReport(params, csvFilePath).pipe(
        tap((report: MongoFileAuthorReport) => addProjectInfo(report, projectInfo, csvFilePath)),
        map((report) => cleanParamsForReport(report)),
        map((report: MongoFileAuthorReport) => addConsiderationsForFileAuthorsReport(report)),
    );
}

// exported only to allow the tests
// produce a report about authors that have contributed to files reading from a mongo db (previously loaded with files info)
export function _mongoFileAuthorReport(params: MongoFileAuthorReportParams, csvFilePath?: string) {
    const fileAuthor = fileAuthors(params.connectionString, params.dbName, params.filesCollection, params.after);
    return fileAuthorsReportCore(fileAuthor, params, csvFilePath);
}
