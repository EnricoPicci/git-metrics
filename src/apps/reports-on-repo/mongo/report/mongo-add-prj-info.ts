import { map, tap, concatMap } from 'rxjs';
import { commitsInfo } from '../query/all-commits-query';
import { MongoReportParams } from './mongo-report';
import { ProjectInfo } from '../../1-C-aggregate-types/project-info';
import { clocSummaryCsvRaw$ } from '../../../../cloc-functions/cloc';

function mongoProjectCommitsInfo(params: MongoReportParams) {
    return commitsInfo(params.connectionString, params.dbName, params.commitsCollection!);
}

export function mongoProjectInfo(params: MongoReportParams) {
    return mongoProjectCommitsInfo(params).pipe(
        map((commits) => ({ commits })),
        concatMap((prjInfo) =>
            clocSummaryCsvRaw$(params.repoFolderPath!).pipe(
                map((clocSummaryInfo) => ({ clocSummaryInfo, ...prjInfo } as ProjectInfo)),
            ),
        ),
        tap({
            next: () => console.log(`====>>>> GENERAL PROJECT INFO CALCULATED including Mongo Info`),
        }),
    );
}
