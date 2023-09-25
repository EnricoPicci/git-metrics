import { map } from 'rxjs';
import { executeCommand, executeCommandObs } from '../tools/execute-command/execute-command';

import { ClocLanguageStats } from './cloc.model';
import { CONFIG } from '../config';
import path from 'path';

// runClocSummary is a function that runs the cloc command and returns the result in the form of a ClocLanguageStats array
// The result is a summary in the sense that it does show results per language but not per file
export function runClocSummary(path = './', vcs?: string) {
    const _vcs = vcs ? `--vcs=${vcs}` : '';
    // #todo - check if we need to specify { encoding: 'utf-8' } as an argument
    return executeCommandObs('run cloc', `cloc --json ${_vcs} --timeout=${CONFIG.CLOC_TIMEOUT} ${path}`).pipe(
        map((output) => {
            const clocOutputJson = JSON.parse(output);
            const clocStatsArray: ClocLanguageStats[] = [];
            Object.entries(clocOutputJson).forEach(([language, stats]: [string, any]) => {
                if (language !== 'header') {
                    const langStats: ClocLanguageStats = {
                        language,
                        nFiles: stats.nFiles,
                        blank: stats.blank,
                        comment: stats.comment,
                        code: stats.code,
                    };
                    clocStatsArray.push(langStats);
                }
            });
            return clocStatsArray;
        }),
    );
}

// runClocSummaryOnGitRepo is a function that runs the cloc command on a git repo
// and returns the result in the form of a ClocLanguageStats array
export function runClocSummaryOnGitRepo(repoPath = './') {
    return runClocSummary(repoPath, 'git');
}

// writeClocLog is a function that runs the cloc command and writes the result in a file
// the by-file option is used to get the result per file
export function writeClocLog_ByFile(params: ClocParams, action = 'writeClocLogByFile') {
    const [cmd, out] = clocByFileCommand(params);
    executeCommand(action, cmd);
    console.log(
        `====>>>> Number of lines in the files contained in the repo folder ${params.folderPath} calculated`,
    );
    console.log(`====>>>> cloc info saved on file ${out}`);
    return out;
}
export type ClocParams = {
    folderPath: string;
    outDir: string;
    outClocFile?: string;
    outClocFilePrefix?: string;
    clocDefsPath?: string;
    useNpx?: boolean
};

function clocByFileCommand(params: ClocParams) {
    // npx cloc . --vcs=git --csv  --timeout=1000000 --out=/home/enrico/code/git-metrics/temp/git-metrics-cloc.csv --by-file
    const cd = `cd ${params.folderPath}`;
    const program = params.useNpx ? 'npx cloc' : 'cloc';
    const clocDefPath = params.clocDefsPath ? `--force-lang-def=${params.clocDefsPath}` : '';
    const out = _buildClocOutfile(params, '-cloc.csv');
    const cmd = `${cd} && ${program} . --vcs=git --csv ${clocDefPath} --timeout=${CONFIG.CLOC_TIMEOUT} --out=${out} --by-file`;
    return [cmd, out];
}
export function buildClocOutfile(config: ClocParams) {
    return _buildClocOutfile(config, '-cloc.csv');
}
function _buildClocOutfile(config: ClocParams, endPart: string) {
    const outDir = config.outDir ? config.outDir : './';
    const outFile = buildOutfileName(config.outClocFile!, config.folderPath, config.outClocFilePrefix, endPart);
    const out = path.resolve(path.join(outDir, outFile));
    return out;
}

/**
 * Generates an output file name based on the provided parameters.
 * If an `outFile` parameter is provided, it will be used as the output file name.
 * Otherwise, the output file name will be generated based on the `prefix`, `folder`, and `postfix` parameters.
 * If `prefix` is provided, it will be used as a prefix for the output file name.
 * If `repoFolder` is provided, it will be used as the base folder name for the output file name.
 * If `postfix` is provided, it will be appended to the end of the output file name.
 * If `repoFolder` is not provided or is an empty string, the current working directory name will be used as the base folder name.
 * @param outFile The desired output file name.
 * @param repoFolder An optional base folder name for the output file name.
 * @param prefix An optional prefix for the output file name.
 * @param postfix An optional postfix for the output file name.
 * @returns The generated output file name.
 */
export function buildOutfileName(outFile = '', repoFolder = '', prefix?: string, postfix?: string) {
    const repoFolderName = path.parse(repoFolder).name;
    const isCurrentFolder = repoFolderName === '' || repoFolderName === '.';
    const _repoFolderName = isCurrentFolder ? path.parse(process.cwd()).name : repoFolderName;
    const _prefix = prefix ?? '';
    const _postfix = postfix ?? '';
    return outFile ? outFile : `${_prefix}${(_repoFolderName)}${_postfix}`;
}