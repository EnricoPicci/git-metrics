// In order to load the mongo db with the info in the git repo, move to the folder containing the repo and run the following command (remember to compile)
// npm run tsc
// node $HOME/enrico-code/behavioral-code-analysis/git-metrics/dist/scripts-mongo/load-mongo-run-reports -f '*.ts*' -d $HOME/temp -s mongodb://localhost:27017- a 2021-01-01 -d $HOME/temp
// node $HOME/enrico-code/behavioral-code-analysis/git-metrics/dist/scripts-mongo/load-mongo-run-reports -f '*.ts*' -d $HOME/temp -s mongodb://localhost:27017 -a 2021-01-01 -d $HOME/temp --dbName gitMetrics-1

import path from 'path';
import { forkJoin } from 'rxjs';
import { concatMap, map } from 'rxjs/operators';
import { ConfigReadCommits, ConfigReadCloc } from '../../../1-A-read/read-params/read-params';
import { readAll } from '../../../1-A-read/read-all';
import { loadAllCommitsFiles } from '../../load/load-commits-files';
import { mongoFileChurnReport } from '../../report/mongo-file-churn-report';
import { mongoProjectInfo } from '../../report/mongo-add-prj-info';
import { mongoAuthorChurnReport } from '../../report/mongo-author-churn-report';
import { mongoModuleChurnReport } from '../../report/mongo-module-churn-report';
import { mongoFileAuthorReport } from '../../report/mongo-file-author-report';
import { mongoFilesCouplingReport } from '../../report/mongo-files-coupling-report';
import { createDirIfNotExisting } from '../../../1-A-read/create-outdir';

export function loadMongRunReports(
    connectionString: string,
    outDir: string,
    repoFolderPath: string,
    dbName: string,
    after: string,
    filter?: string[],
    outFile?: string,
    outClocFile?: string,
    collName?: string,
    buffer?: number,
    clocDefsPath?: string,
    logProgress?: boolean,
    mongoConcurrency?: number,
) {
    // create the output directory if not existing
    createDirIfNotExisting(outDir);

    // we must load all commits to be able to determine the creation date of a file
    // since the creation date is determined by the first commit the file was in, therefore we do not specify
    // the "after" propety in the "commitOptions" object
    const commitOptions: ConfigReadCommits = { filter, outDir, repoFolderPath, outFile };

    const readClocOptions: ConfigReadCloc = { outDir, repoFolderPath, outClocFile, clocDefsPath };

    const [commitLogPath, clocLogPath] = readAll(commitOptions, readClocOptions);

    const params = {
        repoFolderPath,
        outDir,
        connectionString,
        dbName,
        filter,
        clocDefsPath,
    };

    // load all commits and files info just read from git
    return loadAllCommitsFiles(
        commitLogPath,
        connectionString,
        dbName,
        collName,
        buffer,
        clocLogPath,
        logProgress,
        mongoConcurrency,
    ).pipe(
        // calculate the general project info
        concatMap(({ commitsCollection, filesCollection }) => {
            const paramsWithCollections = { ...params, commitsCollection, filesCollection };
            return mongoProjectInfo(paramsWithCollections).pipe(map((prjInfo) => ({ prjInfo, paramsWithCollections })));
        }),
        // prepare to run all reports
        map(({ prjInfo, paramsWithCollections }) => {
            const _params = { ...paramsWithCollections, after: new Date(after) };
            const _outFileChurn = outFile ? outFile : `${paramsWithCollections.filesCollection}-files-churn.csv`;
            const csvFileChurnPath = path.join(outDir, _outFileChurn);
            const _outModuleChurn = outFile ? outFile : `${paramsWithCollections.filesCollection}-module-churn.csv`;
            const csvModuleChurnPath = path.join(outDir, _outModuleChurn);
            const _outAuthorChurn = outFile ? outFile : `${paramsWithCollections.filesCollection}-authors-churn.csv`;
            const csvAuthorChurnPath = path.join(outDir, _outAuthorChurn);
            const _outFilesAuthors = outFile ? outFile : `${paramsWithCollections.filesCollection}-files-authors.csv`;
            const csvFilesAuthors = path.join(outDir, _outFilesAuthors);
            const _outFilesCoupling = outFile ? outFile : `${paramsWithCollections.filesCollection}-files-coupling.csv`;
            const csvFilesCoupling = path.join(outDir, _outFilesCoupling);
            return [
                mongoFileChurnReport(_params, prjInfo, csvFileChurnPath),
                mongoModuleChurnReport(_params, prjInfo, csvModuleChurnPath),
                mongoAuthorChurnReport(_params, prjInfo, csvAuthorChurnPath),
                mongoFileAuthorReport(_params, prjInfo, csvFilesAuthors),
                mongoFilesCouplingReport(_params, prjInfo, csvFilesCoupling),
            ];
        }),
        // run the reports
        concatMap((reportBuilders) => {
            return forkJoin(reportBuilders);
        }),
    );
}
