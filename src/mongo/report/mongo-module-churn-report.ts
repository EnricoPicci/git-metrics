import { map, tap, concatMap, share, toArray } from 'rxjs/operators';
import {
    addConsiderationsForModuleChurnReport,
    ModuleChurnReport,
    moduleChurnReportCore,
    ModuleChurnReportParams,
} from '../../1-D-reports/module-churn-report';
import { fileChurn } from '../query/file-churn-query';
import { mongoProjectInfo } from './mongo-add-prj-info';
import { addProjectInfo } from '../../1-D-reports/add-project-info';
import { ProjectInfo } from '../../1-C-aggregate-types/project-info';
import { cleanParamsForReport, MongoReportParams } from './mongo-report';
import { moduleChurns } from '../../1-C-aggregate-in-memory/module-churn-aggregate';

export type MongoModuleChurnReportParams = {
    // for this type of report the files collection is mandatory
    filesCollection: string;
} & MongoReportParams &
    ModuleChurnReportParams;
export type MongoModuleChurnReport = {
    // this report uses the same query used to calculate the files churn report
    params: { val?: MongoModuleChurnReportParams; description: string };
} & ModuleChurnReport;

// produce a report about module churn and general project info reading from a mongo db (previously loaded with commit and files info)
// reads also from the repo folder for information about the files currently in the project
export function mongoModuleChurnReportWithProjectInfo(params: MongoModuleChurnReportParams, csvFilePrefix?: string) {
    return mongoProjectInfo(params).pipe(
        concatMap((prjInfo) => {
            return mongoModuleChurnReport(params, prjInfo, csvFilePrefix);
        }),
    );
}

export function mongoModuleChurnReport(
    // this report uses the same parameters for the query to monfo as the file churn report
    params: MongoModuleChurnReportParams,
    projectInfo: ProjectInfo,
    csvFilePrefix?: string,
) {
    return _mongoModuleChurnReport(params, csvFilePrefix).pipe(
        tap((report: MongoModuleChurnReport) => {
            addProjectInfo(report, projectInfo, report.csvFile.val);
        }),
        map((report) => cleanParamsForReport(report) as MongoModuleChurnReport),
        map((report) => addConsiderationsForModuleChurnReport(report) as MongoModuleChurnReport),
    );
}

// exported only to allow the tests
// produce a report about module churn reading from a mongo db (previously loaded with files info)
// if csvFilePath is specified, is the path of the file where the data coming from the files collection query is saved
export function _mongoModuleChurnReport(params: MongoModuleChurnReportParams, csvFilePath?: string) {
    const fileChurnSource = fileChurn(
        params.connectionString,
        params.dbName,
        params.filesCollection,
        params.after,
    ).pipe(toArray(), share());
    const moduleChurnsStream = moduleChurns(fileChurnSource);
    return moduleChurnReportCore(moduleChurnsStream, params, csvFilePath);
}
