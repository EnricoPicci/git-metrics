import { Observable } from 'rxjs';
import { map, tap, concatMap, reduce } from 'rxjs/operators';
import { CommitsInfo } from '../aggregate-types/all-commits';
import { ProjectInfo } from '../aggregate-types/project-info';
import { GitCommitEnriched } from '../git-enriched-types/git-types';

export function projectInfo(commits: Observable<GitCommitEnriched>, clocSummaryInfo: Observable<string[]>) {
    return _projectCommitsInfo(commits).pipe(
        map((commits) => ({ commits })),
        concatMap((prjInfo) =>
            clocSummaryInfo.pipe(map((clocSummaryInfo) => ({ clocSummaryInfo, ...prjInfo } as ProjectInfo))),
        ),
        tap({
            next: () => console.log(`====>>>> GENERAL PROJECT INFO CALCULATED`),
        }),
    );
}

export function projectCommitsInfo(commits: GitCommitEnriched[]) {
    return commits.reduce(
        (commitsInfo, commit) => {
            commitsInfo.count++;
            commitsInfo.first.committerDate =
                commitsInfo.first.committerDate > commit.committerDate
                    ? commit.committerDate
                    : commitsInfo.first.committerDate;
            commitsInfo.last.committerDate =
                commitsInfo.last.committerDate < commit.committerDate
                    ? commit.committerDate
                    : commitsInfo.last.committerDate;
            return commitsInfo;
        },
        {
            count: 0,
            first: {
                committerDate: new Date(),
            },
            last: {
                // smallest date see: https://stackoverflow.com/a/11526569/5699993
                committerDate: new Date(-8640000000000000),
            },
        } as CommitsInfo,
    );
}

function _projectCommitsInfo(commits: Observable<GitCommitEnriched>) {
    return commits.pipe(
        reduce(
            (commitsInfo, commit) => {
                commitsInfo.count++;
                commitsInfo.first.committerDate =
                    commitsInfo.first.committerDate > commit.committerDate
                        ? commit.committerDate
                        : commitsInfo.first.committerDate;
                commitsInfo.last.committerDate =
                    commitsInfo.last.committerDate < commit.committerDate
                        ? commit.committerDate
                        : commitsInfo.last.committerDate;
                return commitsInfo;
            },
            {
                count: 0,
                first: {
                    committerDate: new Date(),
                },
                last: {
                    // smallest date see: https://stackoverflow.com/a/11526569/5699993
                    committerDate: new Date(-8640000000000000),
                },
            } as CommitsInfo,
        ),
    );
}
