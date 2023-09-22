import path from 'path';
import fs from 'fs';
import { forkJoin, of } from 'rxjs';
import { map } from 'rxjs/operators';

import { ConfigReadCommits, ConfigReadCloc } from '../../1-A-read/read-params/read-params';
import { readAll } from '../../1-A-read/read-all';
import { createDirIfNotExisting } from '../../1-A-read/create-outdir';

import { _runReportsFromStreams, _streams } from './run-reports-on-repo-core';

export function runAllReportsOnMultiRepos(
    reports: string[],
    repoFolderPaths: string[],
    filter: string[],
    after: string,
    before: string,
    outDir: string,
    outFilePrefix: string,
    clocDefsPath: string,
    ignoreClocZero: boolean,
    depthInFilesCoupling: number,
    concurrentReadOfCommits: boolean,
    noRenames: boolean,
) {
    // create the output directory if not existing
    createDirIfNotExisting(outDir);

    const allReports = repoFolderPaths.map((repoFolderPath) => {
        // read the data from git and cloc tool
        const commitOptions: ConfigReadCommits = { repoFolderPath, outDir, filter, noRenames, reverse: true };
        const readClocOptions: ConfigReadCloc = { repoFolderPath, outDir };
        const [commitLogPath, clocLogPath, clocSummaryPath] = readAll(commitOptions, readClocOptions);

        // generation of the source streams
        const { _commitStream, _filesStream, _clocSummaryStream } = _streams(
            commitLogPath,
            clocLogPath,
            clocSummaryPath,
            concurrentReadOfCommits,
        );

        // run the reports
        return _runReportsFromStreams(
            reports,
            repoFolderPath,
            filter,
            after,
            before,
            outDir,
            outFilePrefix,
            clocDefsPath,
            ignoreClocZero,
            depthInFilesCoupling,
            _commitStream,
            _filesStream,
            _clocSummaryStream,
        ).pipe(
            map((reports) => {
                return { reports, repoFolderPath };
            }),
        );
    });

    return forkJoin(allReports);
}

export function gitRepos(startingFolder = './') {
    const repos = fetchAllGitReposFromGivenFolder(startingFolder);
    console.log(`>>>>>>>>>> Found ${repos.length} git repos in ${startingFolder}`);
    return of(repos);
}

export function fetchAllDirsFromGivenFolder(fullPath: string) {
    let dirs: string[] = [];
    fs.readdirSync(fullPath).forEach((fileOrDir) => {
        const absolutePath = path.join(fullPath, fileOrDir);
        if (fs.statSync(absolutePath).isDirectory()) {
            dirs.push(absolutePath);
            const _subDirs = fetchAllDirsFromGivenFolder(absolutePath);
            dirs = dirs.concat(_subDirs);
        }
    });
    return dirs;
}

export function fetchAllGitReposFromGivenFolder(fullPath: string) {
    let gitRepos: string[] = [];
    const filesAndDirs = fs.readdirSync(fullPath);
    if (filesAndDirs.some((fileOrDir) => fileOrDir === '.git')) {
        gitRepos.push(fullPath);
    }
    filesAndDirs.forEach((fileOrDir) => {
        const absolutePath = path.join(fullPath, fileOrDir);
        if (fs.statSync(absolutePath).isDirectory()) {
            const subRepos = fetchAllGitReposFromGivenFolder(absolutePath);
            gitRepos = gitRepos.concat(subRepos);
        }
    });
    return gitRepos;
}