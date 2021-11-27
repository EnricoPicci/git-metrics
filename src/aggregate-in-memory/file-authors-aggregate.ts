import { from, Observable } from 'rxjs';
import { concatMap, map, reduce } from 'rxjs/operators';

import { FileGitCommitEnriched } from '../git-enriched-types/git-types';
import { FileAuthors } from '../aggregate-types/file-authors';

// reads a commitLog and the cloc data from log files and returns a stream of FileAuthors objects
export function fileAuthors(fileCommits: Observable<FileGitCommitEnriched>, after?: Date) {
    return fileAuthorsDictionary(fileCommits, after).pipe(
        concatMap((fileWithAuthorsDict) => {
            const _fileAuthors = Object.values(fileWithAuthorsDict).sort((a, b) => b.authors - a.authors);
            return from(_fileAuthors);
        }),
    );
}

// returns a dictionary whose key is the the file path and the value is an object of type FileAuthors
// exported for testing purposes only
export function fileAuthorsDictionary(fileCommits: Observable<FileGitCommitEnriched>, after?: Date) {
    return fileCommits.pipe(
        // first group the fileCommits per file and author
        reduce((fileDict, fileCommit) => {
            if (fileCommit.committerDate < after) {
                return fileDict;
            }
            if (!fileDict[fileCommit.path]) {
                fileDict[fileCommit.path] = {};
            }
            const fileAuthorDict = fileDict[fileCommit.path];
            if (!fileAuthorDict[fileCommit.authorName]) {
                fileAuthorDict[fileCommit.authorName] = {
                    path: fileCommit.path,
                    authorName: fileCommit.authorName,
                    cloc: fileCommit.cloc ?? 0,
                    linesAdded: 0,
                    linesDeleted: 0,
                    linesAddDel: 0,
                    commits: 0,
                    created: new Date(),
                };
            }
            fileAuthorDict[fileCommit.authorName].linesAdded =
                fileAuthorDict[fileCommit.authorName].linesAdded + fileCommit.linesAdded;
            fileAuthorDict[fileCommit.authorName].linesDeleted =
                fileAuthorDict[fileCommit.authorName].linesDeleted + fileCommit.linesDeleted;
            fileAuthorDict[fileCommit.authorName].linesAddDel =
                fileAuthorDict[fileCommit.authorName].linesAddDel + fileCommit.linesAdded + fileCommit.linesDeleted;
            fileAuthorDict[fileCommit.authorName].commits = fileAuthorDict[fileCommit.authorName].commits + 1;
            fileAuthorDict[fileCommit.authorName].created =
                fileAuthorDict[fileCommit.authorName].created > fileCommit.committerDate
                    ? fileCommit.committerDate
                    : fileAuthorDict[fileCommit.authorName].created;
            return fileDict;
        }, {} as { [path: string]: { [author: string]: { path: string; authorName: string; cloc: number; linesAdded: number; linesDeleted: number; linesAddDel: number; commits: number; created: Date } } }),
        map((fileDict) => {
            // for each file we scan all the authors who have committed at least once this file and calculate some data
            // among which how many authors a certain file has had
            return Object.entries(fileDict).reduce((fileWithAuthorsDict, val) => {
                const [path, fileAuthorDict] = val;
                const firstFile = Object.values(fileAuthorDict)[0];
                if (fileWithAuthorsDict[path]) {
                    // this is a check just to make sure that if the logic is wrong we get to know it asap
                    throw new Error(`Unxpected double occurrence of path "${path}" in dictionary ${fileDict}`);
                }
                if (!firstFile) {
                    // this is a check just to make sure that if the logic is wrong we get to know it asap
                    throw new Error(
                        `We expect always at least a file for an author, but for the key "${path}" in dictionary ${fileDict} we find an empty dictionary`,
                    );
                }
                fileWithAuthorsDict[path] = {
                    path,
                    cloc: firstFile.cloc,
                    authors: 0,
                    commits: 0,
                    linesAdded: 0,
                    linesDeleted: 0,
                    linesAddDel: 0,
                    created: new Date(),
                };
                // we loop through each author who has committed this file at least once and calculate the data for the file
                const fileWithAuthorsVal = fileWithAuthorsDict[path];
                Object.values(fileAuthorDict).forEach((v) => {
                    fileWithAuthorsVal.authors++;
                    fileWithAuthorsVal.commits = fileWithAuthorsVal.commits + v.commits;
                    fileWithAuthorsVal.linesAdded = fileWithAuthorsVal.linesAdded + v.linesAdded;
                    fileWithAuthorsVal.linesDeleted = fileWithAuthorsVal.linesDeleted + v.linesDeleted;
                    fileWithAuthorsVal.linesAddDel = fileWithAuthorsVal.linesAddDel + v.linesAddDel;
                    fileWithAuthorsVal.created =
                        fileWithAuthorsVal.created > v.created ? v.created : fileWithAuthorsVal.created;
                });
                return fileWithAuthorsDict;
            }, {} as { [path: string]: FileAuthors });
        }),
    );
}
