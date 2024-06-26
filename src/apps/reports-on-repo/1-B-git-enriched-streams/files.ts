import { Observable } from 'rxjs';
import { map, filter, mergeMap } from 'rxjs/operators';
import { FileGitCommitEnriched } from '../1-B-git-enriched-types/git-types';
import { CommitWithFileNumstats } from "../../../git-functions/commit.model";
import { enrichedCommitsStream } from './commits';

// returns a stream of file committed data in the form of an Observable which notifies FileGitCommitEnriched reading data from files containing
// the git log and cloc data
export function filesStream(commitLogPath: string, clocLogPath: string) {
    const _enrichedCommitStream = enrichedCommitsStream(commitLogPath, clocLogPath);
    return filesStreamFromEnrichedCommitsStream(_enrichedCommitStream);
}

export function filesStreamFromEnrichedCommitsStream(enrichedCommitsStream: Observable<CommitWithFileNumstats>) {
    const fileCreationDateDictionary: { [path: string]: Date } = {};
    return enrichedCommitsStream.pipe(
        // create an array of files where each file has also the details of the commit
        map((commit: CommitWithFileNumstats) => {
            const files = [...commit.files];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const basicCommit = { ...commit } as any;
            delete basicCommit.files;
            const enrichedFiles = files.map((file) => {
                // set the file creation date as the date of the first commit which shows this file
                let created = fileCreationDateDictionary[file.path];
                if (!created) {
                    created = commit.committerDate;
                    // first time the file is encountered is considered the date it has been created
                    fileCreationDateDictionary[file.path] = created;
                }
                if (created > commit.committerDate) {
                    console.warn(
                        `!!!! The commit ${commit.hashShort} with file ${file.path} is older than a previous commit containing the same file even if git log is read in reverse order.`,
                    );
                }
                fileCreationDateDictionary[file.path] = created;
                return { ...file, ...basicCommit, created } as FileGitCommitEnriched;
            });
            return enrichedFiles;
        }),
        // consider only the commits which have files
        filter((enrichedFiles) => enrichedFiles.length > 0),
        // use mergeMap to flatten the array of arrays of FileGitCommitEnriched objects into an array of FileGitCommitEnriched objects
        mergeMap((enrichedFilesBuffers) => enrichedFilesBuffers),
    );
}
