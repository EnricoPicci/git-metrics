import { tap, map, concatMap } from 'rxjs/operators';
import {
    addConsiderationsForFilesCouplingReport,
    FilesCouplingReport,
    FilesCouplingReportParams as FilesCouplingReportParams,
    fileCouplingReportCore,
} from '../../reports/file-coupling-report';
import { commits } from '../query/commits-query';
import { mongoProjectInfo } from './mongo-add-prj-info';
import { addProjectInfo } from '../../reports/add-project-info';
import { ProjectInfo } from '../../aggregate-types/project-info';
import { cleanParamsForReport, MongoReportParams } from './mongo-report';
import { fileCoupling } from '../../aggregate-in-memory/file-coupling-aggregate';

export type MongoFilesCouplingReportParams = {
    // for this type of report the commit collection is mandatory
    commitsCollection: string;
} & MongoReportParams &
    FilesCouplingReportParams;
export type MongoFilesCouplingReport = {
    params: { val?: MongoFilesCouplingReportParams; description: string };
} & FilesCouplingReport;

// produce a report about files coupling and general project info reading from a mongo db (previously loaded with commit info)
// reads also from the repo folder for information about the files currently in the project
export function mongoFilesCouplingReportWithProjectInfo(params: MongoFilesCouplingReportParams, csvFilePath?: string) {
    return mongoProjectInfo(params).pipe(
        concatMap((prjInfo) => mongoFilesCouplingReport(params, prjInfo, csvFilePath)),
    );
}

export function mongoFilesCouplingReport(
    params: MongoFilesCouplingReportParams,
    projectInfo: ProjectInfo,
    csvFilePath?: string,
) {
    return _mongoFilesCouplingReport(params, csvFilePath).pipe(
        tap((report: MongoFilesCouplingReport) => {
            addProjectInfo(report, projectInfo, csvFilePath);
        }),
        map((report) => cleanParamsForReport(report)),
        map(
            (report: MongoFilesCouplingReport) =>
                addConsiderationsForFilesCouplingReport(report) as MongoFilesCouplingReport,
        ),
    );
}

// exported only to allow the tests
// produce a report about files coupling reading from a mongo db (previously loaded info)
// if csvFilesChurnFilePath is specified, is the path of the file where the data coming from the files collection query is saved
export function _mongoFilesCouplingReport(params: MongoFilesCouplingReportParams, csvFilePath?: string) {
    const commitsSource = commits(params.connectionString, params.dbName, params.commitsCollection, params.after);
    const couplingsStream = fileCoupling(commitsSource, 10, params.after);
    return fileCouplingReportCore(couplingsStream, params, csvFilePath);
}
