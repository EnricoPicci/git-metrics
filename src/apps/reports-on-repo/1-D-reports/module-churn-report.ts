import { pipe, Observable, forkJoin } from 'rxjs';
import { map, share, concatMap, tap } from 'rxjs/operators';
import { writeFileObs } from 'observable-fs';

import { REPORT_CONFIG } from './config/report-config';
import { addConsideration, addConsiderationsHeader, Report, ReportParams } from './report';
import { addProjectInfo } from './add-project-info';

import { toCsv } from '../../../tools/csv/to-csv';
import { splitPath } from '../../../tools/split-path/split-path';

import { ModuleChurn } from '../1-C-aggregate-types/module-churn';
import { ProjectInfo } from '../1-C-aggregate-types/project-info';

export type ModuleChurnReportParams = {
    // size of the list of modules to be considered as top contributors in terms of churn
    numberOfTopChurnModules?: number;
    // percentage limit, e.g. how many modules contribute to this percentage of churn
    percentThreshold?: number;
} & ReportParams;

export const MODULE_CHURN_REPORT_NAME = 'ModuleChurnReport';
export class ModuleChurnReport extends Report {
    numChurnedFiles = { val: 0, description: `Number of files with churn` };
    numModules = { val: 0, description: `Total number of modules` };
    numChangedModules = { val: 0, description: `Number of modules with churn` };
    maxModuleDepth = { val: 0, description: `Max number of folders in the path of the modules` };
    clocTot = { val: 0, description: `Current total number of lines in the files selected for the report` };
    totChurn = {
        val: 0,
        description: `Total number of lines added or deleted in the files selected for the period chosen`,
    };
    churn_vs_cloc = { val: 0, description: `Churn versus cloc` };
    topChurnedModules = { val: [] as ModuleChurn[], description: `Modules that show the highest churn` };
    constructor(_params: ModuleChurnReportParams) {
        super(_params, MODULE_CHURN_REPORT_NAME, `Module churn report`);
    }
    addConsiderations() {
        return addConsiderationsForModuleChurnReport(this);
    }
}

// API to be used if we want to generate the report for the general project as well as the report about module churn
// reads also from the repo folder for information about the files currently in the project
export function projectAndModuleChurnReport(
    moduleChurns: Observable<ModuleChurn[]>,
    projectInfo: Observable<ProjectInfo>,
    params: ModuleChurnReportParams,
    csvFilePrefix?: string,
) {
    return projectInfo.pipe(concatMap((prjInfo) => moduleChurnReport(moduleChurns, params, prjInfo, csvFilePrefix)));
}

// API to be used if we want to generate the full report including the general project info (e.g. total numnber of lines of code)
// Starts from a stream of ModuleChurn objects
export function moduleChurnReport(
    moduleChurns: Observable<ModuleChurn[]>,
    params: ModuleChurnReportParams,
    projectInfo: ProjectInfo,
    csvFilePrefix?: string,
) {
    return moduleChurnReportCore(moduleChurns, params, csvFilePrefix).pipe(
        tap((report: ModuleChurnReport) => {
            addProjectInfo(report, projectInfo, report.csvFile.val);
        }),
        map((report) => addConsiderationsForModuleChurnReport(report)),
    );
}

// API to be used if we want to generate the core of the report info and not also the general project info
// Starts from a stream of ModuleChurn objects, like when we create the report from a Mongo query
export function moduleChurnReportCore(
    moduleChurns: Observable<ModuleChurn[]>,
    params: ModuleChurnReportParams,
    csvFilePath?: string,
) {
    const moduleChurnSource = moduleChurns.pipe(
        map((churns) => {
            if (churns.length < 1) {
                return { churns, maxDepth: 0 };
            }
            const churnsSorted = churns.sort((a, b) => splitPath(b.path).length - splitPath(a.path).length);
            const maxDepth = splitPath(churnsSorted[0].path).length;
            return { churns, maxDepth };
        }),
        tap((moduleChurns) => {
            console.log(`Processing ${moduleChurns.churns.length} records to generate ModuleChurnReport`);
        }),
        share(),
    );
    const generateReport = moduleChurnSource.pipe(_moduleChurnReport(params));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let concurrentStreams: [Observable<ModuleChurnReport>] = [generateReport as Observable<ModuleChurnReport>];

    if (csvFilePath) {
        const _concurrentStreams: [
            Observable<ModuleChurnReport>,
            Observable<{ churns: ModuleChurn[]; maxDepth: number }>,
        ] = [concurrentStreams[0], moduleChurnSource];
        return forkJoin(_concurrentStreams).pipe(
            concatMap(([report, { churns, maxDepth }]) => {
                const churnsEnriched = churns.map((c) => enrichForCsv(c, maxDepth));
                if (churnsEnriched.length === 0) {
                    console.log('!!!!!!!! no data on file churns to calculate module churns');
                }
                const csvLines = toCsv(churnsEnriched);

                report.csvFile.val = csvFilePath;
                return writeFileObs(csvFilePath, csvLines).pipe(
                    map((csvFile) => [report, csvFile] as [ModuleChurnReport, string]),
                );
            }),
            tap({
                next: ([report, csvFile]) => {
                    console.log(`====>>>> MODULE CHURN REPORT GENERATED -- data saved in ${csvFile}`);
                    report.csvFile.val = csvFile;
                },
            }),
            map(([report]) => report),
        );
    }
    return generateReport.pipe(
        tap({
            next: () => {
                console.log(`====>>>> MODULE CHURN REPORT GENERATED`);
            },
        }),
    );
}

function enrichForCsv(mc: ModuleChurn, maxModuleDepth: number) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const _mc: any = { ...mc };
    _mc.created = _mc.created.toISOString();
    // fill one prop per each folder in the path of the module
    // if a module has less paths than the maximum number of folders found in a path (maxModuleDepth) then place an empty string as value
    const pathFolders = splitPath(mc.path);
    for (let i = 0; i < maxModuleDepth; i++) {
        const propName = `level_${i}`;
        const propVal = pathFolders.length > i ? pathFolders[i] : '';
        _mc[propName] = propVal;
    }
    return _mc;
}

export function _moduleChurnReport(params: ModuleChurnReportParams) {
    return pipe(
        map(({ churns, maxDepth }: { churns: ModuleChurn[]; maxDepth: number }) => {
            const r = new ModuleChurnReport(params);

            const _modulesSortedPerChurn = churns.sort((a, b) => {
                // if the modules have the same churn, return the one that has the lowest depth, in this way we ensure that the root '.'
                // is always the first module even in the cases where in the root there is a folder which contains all the files and therefore
                // has the same churn
                const churnDiff = b.linesAddDel - a.linesAddDel;
                return churnDiff === 0 ? splitPath(a.path).length - splitPath(b.path).length : churnDiff;
            });
            const _topLevelModules = churns.filter((mc) => splitPath(mc.path).length === 1);

            _topLevelModules.forEach((mc) => {
                r.clocTot.val = r.clocTot.val + mc.cloc;
                r.numChurnedFiles.val = r.numChurnedFiles.val + mc.numChurnedFiles;
                r.totChurn.val = r.totChurn.val + mc.linesAddDel;
            });

            // set the default values in the params so that they are correctly reported in the report
            if (params.numberOfTopChurnModules === undefined) {
                params.numberOfTopChurnModules = REPORT_CONFIG.defaultTopChurnModulesListSize;
            }
            if (params.percentThreshold === undefined) {
                params.percentThreshold = REPORT_CONFIG.defaultPercentageThreshold;
            }
            r.churn_vs_cloc.val = r.totChurn.val / r.clocTot.val;
            r.numModules.val = churns.length;
            r.numChangedModules.val = churns.filter((c) => c.linesAddDel > 0).length;
            r.topChurnedModules.val = _modulesSortedPerChurn.slice(0, params.numberOfTopChurnModules);
            r.maxModuleDepth.val = maxDepth;
            return r;
        }),
    );
}
export function addConsiderationsForModuleChurnReport(r: ModuleChurnReport) {
    addConsiderationsHeader(r);
    addConsideration(
        r,
        `The modules who have contributed most to the churn are ${r.topChurnedModules.val.map((m) => m.path)}.`,
    );
    if (r.csvFile.val) {
        addConsideration(r, `The modules info have been saved in the file ${r.csvFile.val}.`);
    }
    return r;
}
