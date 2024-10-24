import { CommitWithFileNumstats } from "../../../git-functions/commit.model";

export const testCommits_3 = [
    {
        files: [
            {
                linesAdded: 3,
                linesDeleted: 2,
                path: 'f1',
            },
            {
                linesAdded: 3,
                linesDeleted: 2,
                path: 'f2',
            },
            {
                linesAdded: 3,
                linesDeleted: 2,
                path: 'f3',
            },
        ],
    },
    {
        files: [
            {
                linesAdded: 3,
                linesDeleted: 2,
                path: 'f1',
            },
            {
                linesAdded: 3,
                linesDeleted: 2,
                path: 'f2',
            },
        ],
    },
    {
        files: [
            {
                linesAdded: 3,
                linesDeleted: 2,
                path: 'f1',
            },
        ],
    },
] as CommitWithFileNumstats[];

export const testCommits_5 = [
    ...testCommits_3,
    {
        files: [
            {
                linesAdded: 1,
                linesDeleted: 0,
                path: 'fA',
            },
        ],
    },
    {
        files: [
            {
                linesAdded: 3,
                linesDeleted: 2,
                path: 'f1',
            },
            {
                linesAdded: 1,
                linesDeleted: 0,
                path: 'fA',
            },
        ],
    },
] as CommitWithFileNumstats[];
