import { Observable } from 'rxjs';
import { FileGitCommitEnriched, GitCommitEnriched } from '../git-enriched-types/git-types';
import { enrichedCommitsStream } from './commits';
import { filesStreamFromEnrichedCommitsStream } from './files';
import { ConfigReadCloc, ConfigReadCommits } from './config/config';
import { readAll } from './read-all';

// API to read the git log and run the cloc command and return a stream of GitCommitEnriched and a stream of FileGitCommitEnriched objects
// we must load all commits to be able to determine the creation date of a file
// since the creation date is determined by the first commit the file was in, therefore we do not specify
// the "after" propety in the "commitOptions" object
export function gitReadEnrich(
    repoFolderPath: string,
    filter?: string[],
    outDir?: string,
    outFile?: string,
    outClocFile?: string,
    clocDefsPath?: string,
) {
    const commitOptions: ConfigReadCommits = { filter, outDir, repoFolderPath, outFile, reverse: true };

    const readClocOptions: ConfigReadCloc = { outDir, repoFolderPath, outClocFile, clocDefsPath };

    const [commitLogPath, clocLogPath] = readAll(commitOptions, readClocOptions);

    const commits = enrichedCommitsStream(commitLogPath, clocLogPath);
    const fileCommits = filesStreamFromEnrichedCommitsStream(commits);

    return [commits, fileCommits] as [Observable<GitCommitEnriched>, Observable<FileGitCommitEnriched>];
}

// API to read the git log and run the cloc command and return a stream of GitCommitEnriched
// we must load all commits to be able to determine the creation date of a file
// since the creation date is determined by the first commit the file was in, therefore we do not specify
// the "after" propety in the "commitOptions" object
export function gitReadCommitEnrich(
    repoFolderPath: string,
    filter?: string[],
    outDir?: string,
    outFile?: string,
    outClocFile?: string,
    clocDefsPath?: string,
    reverse?: boolean,
) {
    const commitOptions: ConfigReadCommits = { filter, outDir, repoFolderPath, outFile, reverse };

    const readClocOptions: ConfigReadCloc = { outDir, repoFolderPath, outClocFile, clocDefsPath };

    const [commitLogPath, clocLogPath] = readAll(commitOptions, readClocOptions);

    const commits = enrichedCommitsStream(commitLogPath, clocLogPath);

    return commits;
}
