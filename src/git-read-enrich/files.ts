import { from, Observable } from 'rxjs';
import { map, filter, concatMap, toArray, mergeMap } from 'rxjs/operators';
import { GitCommitEnriched, FileGitCommitEnriched } from '../git-enriched-types/git-types';
import { enrichedCommitsStream } from './commits';

// returns a stream of file committed data in the form of an Observable which notifies FileGitCommitEnriched reading data from files containing
// the git log and cloc data
export function filesStream(commitLogPath: string, clocLogPath: string) {
    return filesStreamFromEnrichedCommitsStream(enrichedCommitsStream(commitLogPath, clocLogPath));
}

export function filesStreamFromEnrichedCommitsStream(enrichedCommitsStream: Observable<GitCommitEnriched>) {
    const fileCreationDateDictionary: { [path: string]: Date } = {};
    return enrichedCommitsStream.pipe(
        // create an array of files where each file has also the details of the commit
        map((commit: GitCommitEnriched) => {
            const files = [...commit.files];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const basicCommit = { ...commit } as any;
            delete basicCommit.files;
            const enrichedFiles = files.map((file) => {
                // set the file creation date as the date of the first commit which shows this file
                let created = fileCreationDateDictionary[file.path];
                if (!created) {
                    created = commit.committerDate;
                }
                created = created > commit.committerDate ? commit.committerDate : created;
                fileCreationDateDictionary[file.path] = created;
                return { ...file, ...basicCommit } as FileGitCommitEnriched;
            });
            return enrichedFiles;
        }),
        // consider only the commits which have files
        filter((enrichedFiles) => enrichedFiles.length > 0),
        // toArray makes sure that upstream is completed before we proceed, which is important since we need to have the fileCreationDateDictionary
        // completely filled if we want to set the created date right on each file
        toArray(),
        // use mergeMap to flatten the array of arrays of FileGitCommitEnriched objects into an array of FileGitCommitEnriched objects
        mergeMap((enrichedFilesBuffers) => enrichedFilesBuffers),
        // use concatMap since I need to be sure that the upstream completes so that I have the fileCreationDateDictionary filled correctly
        concatMap((enrichedFiles) =>
            // transform the array of file documents into a stream
            from(enrichedFiles).pipe(
                map((file) => {
                    const created = fileCreationDateDictionary[file.path];
                    return { ...file, created };
                }),
            ),
        ),
    );
}
