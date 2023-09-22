"use strict";
// In order to load the mongo db with the info in the git repo, move to the folder containing the repo and run the following command (remember to compile)
// npm run tsc
// node $HOME/enrico-code/behavioral-code-analysis/git-metrics/dist/scripts-mongo/load-mongo-run-reports -f '*.ts*' -d $HOME/temp -s mongodb://localhost:27017- a 2021-01-01 -d $HOME/temp
// node $HOME/enrico-code/behavioral-code-analysis/git-metrics/dist/scripts-mongo/load-mongo-run-reports -f '*.ts*' -d $HOME/temp -s mongodb://localhost:27017 -a 2021-01-01 -d $HOME/temp --dbName gitMetrics-1
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadMongRunReports = void 0;
const path_1 = __importDefault(require("path"));
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const read_all_1 = require("../../../reports-on-repos/1-A-read/read-all");
const load_commits_files_1 = require("../../load/load-commits-files");
const mongo_file_churn_report_1 = require("../../report/mongo-file-churn-report");
const mongo_add_prj_info_1 = require("../../report/mongo-add-prj-info");
const mongo_author_churn_report_1 = require("../../report/mongo-author-churn-report");
const mongo_module_churn_report_1 = require("../../report/mongo-module-churn-report");
const mongo_file_author_report_1 = require("../../report/mongo-file-author-report");
const mongo_files_coupling_report_1 = require("../../report/mongo-files-coupling-report");
const create_outdir_1 = require("../../../reports-on-repos/1-A-read/create-outdir");
function loadMongRunReports(connectionString, repoFolderPath, filter, after, outDir, outFile, outClocFile, dbName, collName, buffer, clocDefsPath, logProgress, mongoConcurrency) {
    // create the output directory if not existing
    (0, create_outdir_1.createDirIfNotExisting)(outDir);
    // we must load all commits to be able to determine the creation date of a file
    // since the creation date is determined by the first commit the file was in, therefore we do not specify
    // the "after" propety in the "commitOptions" object
    const commitOptions = { filter, outDir, repoFolderPath, outFile };
    const readClocOptions = { outDir, repoFolderPath, outClocFile, clocDefsPath };
    const [commitLogPath, clocLogPath] = (0, read_all_1.readAll)(commitOptions, readClocOptions);
    const params = {
        repoFolderPath,
        outDir,
        connectionString,
        dbName,
        filter,
        clocDefsPath,
    };
    // load all commits and files info just read from git
    return (0, load_commits_files_1.loadAllCommitsFiles)(commitLogPath, connectionString, dbName, collName, buffer, clocLogPath, logProgress, mongoConcurrency).pipe(
    // calculate the general project info
    (0, operators_1.concatMap)(({ commitsCollection, filesCollection }) => {
        const paramsWithCollections = Object.assign(Object.assign({}, params), { commitsCollection, filesCollection });
        return (0, mongo_add_prj_info_1.mongoProjectInfo)(paramsWithCollections).pipe((0, operators_1.map)((prjInfo) => ({ prjInfo, paramsWithCollections })));
    }), 
    // prepare to run all reports
    (0, operators_1.map)(({ prjInfo, paramsWithCollections }) => {
        const _params = Object.assign(Object.assign({}, paramsWithCollections), { after: new Date(after) });
        const _outFileChurn = outFile ? outFile : `${paramsWithCollections.filesCollection}-files-churn.csv`;
        const csvFileChurnPath = path_1.default.join(outDir, _outFileChurn);
        const _outModuleChurn = outFile ? outFile : `${paramsWithCollections.filesCollection}-module-churn.csv`;
        const csvModuleChurnPath = path_1.default.join(outDir, _outModuleChurn);
        const _outAuthorChurn = outFile ? outFile : `${paramsWithCollections.filesCollection}-authors-churn.csv`;
        const csvAuthorChurnPath = path_1.default.join(outDir, _outAuthorChurn);
        const _outFilesAuthors = outFile ? outFile : `${paramsWithCollections.filesCollection}-files-authors.csv`;
        const csvFilesAuthors = path_1.default.join(outDir, _outFilesAuthors);
        const _outFilesCoupling = outFile ? outFile : `${paramsWithCollections.filesCollection}-files-coupling.csv`;
        const csvFilesCoupling = path_1.default.join(outDir, _outFilesCoupling);
        return [
            (0, mongo_file_churn_report_1.mongoFileChurnReport)(_params, prjInfo, csvFileChurnPath),
            (0, mongo_module_churn_report_1.mongoModuleChurnReport)(_params, prjInfo, csvModuleChurnPath),
            (0, mongo_author_churn_report_1.mongoAuthorChurnReport)(_params, prjInfo, csvAuthorChurnPath),
            (0, mongo_file_author_report_1.mongoFileAuthorReport)(_params, prjInfo, csvFilesAuthors),
            (0, mongo_files_coupling_report_1.mongoFilesCouplingReport)(_params, prjInfo, csvFilesCoupling),
        ];
    }), 
    // run the reports
    (0, operators_1.concatMap)((reportBuilders) => {
        return (0, rxjs_1.forkJoin)(reportBuilders);
    }));
}
exports.loadMongRunReports = loadMongRunReports;
//# sourceMappingURL=load-mongo-run-reports-core.js.map