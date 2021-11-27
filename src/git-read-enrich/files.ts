import { from, Observable } from 'rxjs';
import { map, filter, mergeMap } from 'rxjs/operators';
import { GitCommitEnriched, FileGitCommitEnriched } from '../git-enriched-types/git-types';
import { enrichedCommitsStream } from './commits';

// returns a stream of file committed data in the form of an Observable which notifies FileGitCommitEnriched reading data from files containing
// the git log and cloc data

export function filesStream(commitLogPath: string, clocLogPath: string) {
    return enrichedCommitsStream(commitLogPath, clocLogPath).pipe(
        // create an array of files where each file has also the details of the commit
        map((commit: GitCommitEnriched) => {
            const files = [...commit.files];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const basicCommit = { ...commit } as any;
            delete basicCommit.files;
            const enrichedFiles = files.map((file) => ({ ...file, ...basicCommit } as FileGitCommitEnriched));
            return enrichedFiles;
        }),
        // consider only the commits which have files
        filter((enrichedFiles) => enrichedFiles.length > 0),
        // transform the array of file documents into a stream
        mergeMap((enrichedFiles) => from(enrichedFiles)),
    );
}

export function filesStreamFromEnrichedCommitsStream(enrichedCommitsStream: Observable<GitCommitEnriched>) {
    return enrichedCommitsStream.pipe(
        // create an array of files where each file has also the details of the commit
        map((commit: GitCommitEnriched) => {
            const files = [...commit.files];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const basicCommit = { ...commit } as any;
            delete basicCommit.files;
            const enrichedFiles = files.map((file) => ({ ...file, ...basicCommit } as FileGitCommitEnriched));
            return enrichedFiles;
        }),
        // consider only the commits which have files
        filter((enrichedFiles) => enrichedFiles.length > 0),
        // transform the array of file documents into a stream
        mergeMap((enrichedFiles) => from(enrichedFiles)),
    );
}
