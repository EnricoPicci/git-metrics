import { expect } from 'chai';
import { ClocDiffStats } from '../../../cloc-functions/cloc-diff.model';

import { flattenMonthlyClocDiffStatsDict } from './cloc-monthly-diff-repos';

describe('flattenClocDiffStatsDict', () => {
    it('should flatten a dictionary of ClocDiffStats objects into a list of flattened objects', () => {
        const numOfPythonFilesSameIn2021_01 = 21;

        const repoPath = 'repoPath';
        const clocDiffStats: {
            [yearMonth: string]: ClocDiffStats;
        } = {
            '2021-01': {
                mostRecentCommitSha: '123',
                leastRecentCommitSha: 'abc',
                diffs: {
                    added: {
                        Java: {
                            nFiles: 1,
                            blank: 2,
                            comment: 3,
                            code: 4,
                        },
                        Python: {
                            nFiles: 5,
                            blank: 6,
                            comment: 7,
                            code: 8,
                        },
                    },
                    removed: {
                        Java: {
                            nFiles: 9,
                            blank: 10,
                            comment: 11,
                            code: 12,
                        },
                        Python: {
                            nFiles: 13,
                            blank: 14,
                            comment: 15,
                            code: 16,
                        },
                    },
                    same: {
                        Java: {
                            nFiles: 17,
                            blank: 18,
                            comment: 19,
                            code: 20,
                        },
                        Python: {
                            nFiles: numOfPythonFilesSameIn2021_01,
                            blank: 22,
                            comment: 23,
                            code: 24,
                        },
                    },
                    modified: {
                        Java: {
                            nFiles: 25,
                            blank: 26,
                            comment: 27,
                            code: 28,
                        },
                        Python: {
                            nFiles: 29,
                            blank: 30,
                            comment: 31,
                            code: 32,
                        },
                    },
                },
            },
            '2021-02': {
                mostRecentCommitSha: '789',
                leastRecentCommitSha: 'xyz',
                diffs: {
                    added: {
                        Java: {
                            nFiles: 1,
                            blank: 2,
                            comment: 3,
                            code: 4,
                        },
                        Python: {
                            nFiles: 5,
                            blank: 6,
                            comment: 7,
                            code: 8,
                        },
                    },
                    removed: {
                        Java: {
                            nFiles: 9,
                            blank: 10,
                            comment: 11,
                            code: 12,
                        },
                        Python: {
                            nFiles: 13,
                            blank: 14,
                            comment: 15,
                            code: 16,
                        },
                    },
                    same: {
                        Java: {
                            nFiles: 17,
                            blank: 18,
                            comment: 19,
                            code: 20,
                        },
                        Python: {
                            nFiles: 21,
                            blank: 22,
                            comment: 23,
                            code: 24,
                        },
                    },
                    modified: {
                        Java: {
                            nFiles: 25,
                            blank: 26,
                            comment: 27,
                            code: 28,
                        },
                        Python: {
                            nFiles: 29,
                            blank: 30,
                            comment: 31,
                            code: 32,
                        },
                    },
                },
            },
        };

        const repoStats = {
            repoPath,
            clocDiffStats,
        };

        const numOfYearMonths = 2; // 2021-01 and 2021-02
        const numOfLanguages = 2; // Java and Python
        const numOfPossibleDiffTypes = 4; // added, removed, same, modified
        const numOfStatsPerDiffType = 4; // nFiles, blank, comment, code
        const expectedNumOfRecs = numOfYearMonths * numOfLanguages * numOfPossibleDiffTypes * numOfStatsPerDiffType;

        const flattened = flattenMonthlyClocDiffStatsDict(repoStats);
        expect(flattened.length).equal(expectedNumOfRecs);
        numOfPythonFilesSameIn2021_01;
        const expectedNumOfPythonFilesSameIn2021_01 = flattened.find((rec) => {
            return rec.yearMonth === '2021-01' && rec.language === 'Python' && rec.diffType === 'same';
        })?.value;
        expect(expectedNumOfPythonFilesSameIn2021_01).equal(numOfPythonFilesSameIn2021_01);
    });

    it('should return an empty list if the input dictionary is empty', () => {
        const repoPath = 'repoPath';
        const clocDiffStats = {};
        const repoStats = {
            repoPath,
            clocDiffStats,
        };
        const expectedFlattened: any[] = [];
        const flattened = flattenMonthlyClocDiffStatsDict(repoStats);
        expect(flattened).deep.equal(expectedFlattened);
    });
});
