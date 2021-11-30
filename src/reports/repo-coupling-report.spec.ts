import { expect } from 'chai';
import path from 'path';
import { of } from 'rxjs';
import { tap, toArray } from 'rxjs/operators';

import { filesStream } from '../git-read-enrich/files';
import { TUPLE_KEY_SEPARATOR } from './dictionary-utils/dictionary-utils';

import {
    timeWindowKey,
    timeWindowedFileCommitsDict,
    FilesInfo,
    splitCommitsInTimeWindows,
    selectTimeWindowsPresentInAllRepos,
    calculateFileTuplesPerTimeWindow,
    groupFileTuples,
    flatFilesCsv,
} from './repo-coupling-report';

describe(`timeWindowKey`, () => {
    it(`two dates which differ for 1 day generate the same timeWindowKey if the timeWindowLengthInDays is 7
    since they are in the same week. COnsidering that Unix Epoch starts with a Thursday, a week in this case starts with a Thursday and
    ends with the following Friday`, () => {
        const date_1 = new Date('2021-09-03T00:00:00.000+00:00');
        const date_2 = new Date('2021-09-02T00:00:00.000+00:00');
        const timeWindowLengthInDays = 7;
        const key_1 = timeWindowKey(date_1, timeWindowLengthInDays);
        const key_2 = timeWindowKey(date_2, timeWindowLengthInDays);
        expect(key_1).equal(key_2);
    });
    it(`two dates which differ for 8 days generate different timeWindowKey if the timeWindowLengthInDays is 7`, () => {
        const date_1 = new Date('2021-09-10T00:00:00.000+00:00');
        const date_2 = new Date('2021-09-02T00:00:00.000+00:00');
        const timeWindowLengthInDays = 7;
        const key_1 = timeWindowKey(date_1, timeWindowLengthInDays);
        const key_2 = timeWindowKey(date_2, timeWindowLengthInDays);
        expect(key_1).gt(key_2);
    });
    it(`two dates which differ for 1 day generate different timeWindowKey if the timeWindowLengthInDays is 1`, () => {
        const date_1 = new Date('2021-09-03T00:00:00.000+00:00');
        const date_2 = new Date('2021-09-02T00:00:00.000+00:00');
        const timeWindowLengthInDays = 1;
        const key_1 = timeWindowKey(date_1, timeWindowLengthInDays);
        const key_2 = timeWindowKey(date_2, timeWindowLengthInDays);
        expect(key_1).gt(key_2);
    });
});

describe(`timeWindowedFileCommitsDict`, () => {
    it(`creates the dictionary of timewindows with the info related to each file which has a commit in that timewindow.
    Since in the test data there are 3 commits with distance of one year, then there are 3 time windows`, (done) => {
        const logName = 'a-git-repo';
        const logFilePath = path.join(process.cwd(), `/test-data/output/${logName}-commits.gitlog`);
        const clocLogPath = path.join(process.cwd(), `/test-data/output/${logName}-cloc.gitlog`);

        const aFilePath = 'hallo.java';

        const filesObs = oneStream(logFilePath, clocLogPath);
        filesObs
            .pipe(
                timeWindowedFileCommitsDict(1, 1),
                tap({
                    next: (timeWindowDict) => {
                        // TEST timeWindowDict
                        // there are 3 commmits in the example used as test data
                        expect(Object.keys(timeWindowDict).length).equal(3);
                        // there is one time window which has just one file
                        const entriesWithJustOneFile = Object.values(timeWindowDict).filter(
                            (tw) => Object.keys(tw).length === 1,
                        );
                        expect(entriesWithJustOneFile.length).equal(1);
                        expect(entriesWithJustOneFile[0][aFilePath].path).equal(aFilePath);
                        // the same file is present in all time windows
                        Object.values(timeWindowDict).forEach((tw) => {
                            expect(tw[aFilePath].path).equal(aFilePath);
                        });
                        // The total number of time windows found in the stream of commits is the same for all the files
                        Object.values(timeWindowDict).forEach((tw) => {
                            Object.values(tw).forEach((f) => {
                                expect(f.totalNumberOfTimeWindowsWithCommits).equal(3);
                            });
                        });
                        //
                        // There is one file which is present in 3 timewindows, the other are present in 2
                        const fileFoundInThreeTimeWindows = 'hallo.java';
                        const allFiles: FilesInfo[] = [];
                        Object.values(timeWindowDict).forEach((tw) => {
                            Object.values(tw).forEach((f) => {
                                allFiles.push(f);
                            });
                        });
                        const filesFoundInThreeTimeWindows = allFiles.filter(
                            (f) => f.path === fileFoundInThreeTimeWindows,
                        );
                        expect(filesFoundInThreeTimeWindows.length).equal(3);
                        filesFoundInThreeTimeWindows.forEach((f) => {
                            expect(f.fileOccurrenciesInTimeWindows).equal(3);
                        });
                        // This is the test for the files which are present in 2 timewindows
                        const filesNOTFoundInThreeTimeWindows = allFiles.filter(
                            (f) => f.path !== fileFoundInThreeTimeWindows,
                        );
                        expect(filesNOTFoundInThreeTimeWindows.length).equal(4);
                        filesNOTFoundInThreeTimeWindows.forEach((f) => {
                            expect(f.fileOccurrenciesInTimeWindows).equal(2);
                        });
                        //
                        // in one time window there has been 1 line added and 1 line deleted in a specific file
                        const anEntry = timeWindowDict[18527];
                        const aFile = anEntry[aFilePath];
                        expect(aFile.linesAdded).equal(1);
                        expect(aFile.linesDeleted).equal(1);
                        expect(aFile.totCommits).equal(3);
                        expect(aFile.commits.length).equal(3);
                    },
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(20000);
    it(`if the timeWindowLengthInDays is very big, all commits fall into the same timewindow`, (done) => {
        const logName = 'a-git-repo';
        const logFilePath = path.join(process.cwd(), `/test-data/output/${logName}-commits.gitlog`);
        const clocLogPath = path.join(process.cwd(), `/test-data/output/${logName}-cloc.gitlog`);

        const timeWindowLengthInDays = 5000;

        const aFilePath = 'hallo.java';

        // first load the commits and the files
        const filesObs = oneStream(logFilePath, clocLogPath);
        filesObs
            .pipe(
                timeWindowedFileCommitsDict(timeWindowLengthInDays, 1),
                tap({
                    next: (timeWindowDict) => {
                        // TEST timeWindowDict
                        // there are 3 commmits but they all fall in the same timewindos, so there is only 1 timewindow
                        expect(Object.keys(timeWindowDict).length).equal(1);
                        // The total number of time windows found in the stream of commits is the same for all the files
                        Object.values(timeWindowDict).forEach((tw) => {
                            Object.values(tw).forEach((f) => {
                                expect(f.totalNumberOfTimeWindowsWithCommits).equal(1);
                            });
                        });
                        //
                        // All files are present in just 1 timewindow since there is just 1 timewindow
                        const allFiles: FilesInfo[] = [];
                        Object.values(timeWindowDict).forEach((tw) => {
                            Object.values(tw).forEach((f) => {
                                allFiles.push(f);
                            });
                        });
                        allFiles.forEach((f) => {
                            expect(f.fileOccurrenciesInTimeWindows).equal(1);
                        });
                        //
                        // one specific file
                        const anEntry = Object.values(timeWindowDict)[0];
                        const aFile = anEntry[aFilePath];
                        expect(aFile.linesAdded).equal(13);
                        expect(aFile.linesDeleted).equal(3);
                        expect(aFile.totCommits).equal(3);
                        expect(aFile.commits.length).equal(3);
                    },
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(20000);
});

describe(`splitCommittsInTimeWindows & selectTimeWindowsPresentInAllRepos`, () => {
    it(`Splits the commits into timewindows and select the timewindows for which there is at least one commit per each repo.
    Since we use, as input, an array of streams of commits which come from the SAME repo, it returns all the time windows.
    In other words, we want to select the time windows that are present in 2 repos, but since the
    repos are the same, all time windows are present in one repo are also present in the other one and therfore we select all of them`, (done) => {
        const logName = 'a-git-repo';
        const logFilePath = path.join(process.cwd(), `/test-data/output/${logName}-commits.gitlog`);
        const clocLogPath = path.join(process.cwd(), `/test-data/output/${logName}-cloc.gitlog`);

        const timeWindowLengthInDays = 1;

        const twoFileStreams = twoStreamsFromSameRepo(logFilePath, clocLogPath);

        twoFileStreams
            .pipe(
                splitCommitsInTimeWindows(timeWindowLengthInDays),
                selectTimeWindowsPresentInAllRepos(),
                tap({
                    next: (timeWindows) => {
                        // the period of analysis (from 2019 to 2021) contains 3 commits in 3 different years
                        // since we are using a timeWindowLengthInDays of 1, then the 3 commits clearly belongto 3 different
                        // time windows
                        expect(timeWindows.length).equal(3);
                        // each entries array in each time window contains a number of elements equal to the number of repos analyzed, which is 2
                        timeWindows.forEach((tw) => {
                            expect(tw.entries.length).equal(2);
                        });
                        // each entry contains 2 dictionaries, each containing the same references to the same files, due to the
                        // fact that we are analyzing two streams of commits coming from the same repo
                        timeWindows.forEach((tw) => {
                            const firstDict = tw.entries[0];
                            const secondDict = tw.entries[1];
                            expect(Object.keys(firstDict).length).equal(Object.keys(secondDict).length);
                        });
                        // one of the commits contain just 1 file
                        const commitsWithOneFile = timeWindows.filter((tw) => Object.keys(tw.entries[0]).length === 1);
                        expect(commitsWithOneFile.length).equal(1);
                        // two of the commits contain 3 file
                        const commitsWithThreeFiles = timeWindows.filter(
                            (tw) => Object.keys(tw.entries[0]).length === 3,
                        );
                        expect(commitsWithThreeFiles.length).equal(2);
                    },
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(20000);
    it(`returns only 1 time window since the 2 repos have only 1 commit which is present in the same time window, the other 2 commits happen in different
    days and therefore belong to different time windows`, (done) => {
        const logName_1 = 'a-git-repo';
        const logFilePath_1 = path.join(process.cwd(), `/test-data/output/${logName_1}-commits.gitlog`);
        const clocLogFilePath_1 = path.join(process.cwd(), `/test-data/output/${logName_1}-cloc.gitlog`);
        const logName_2 = 'a-git-repo-commits-shifted';
        const logFilePath_2 = path.join(process.cwd(), `/test-data/output/${logName_2}.gitlog`);

        const timeWindowLengthInDays = 1;

        const twoStreams = twoStreamsFromDifferentRepos(
            [logFilePath_1, logFilePath_2],
            [clocLogFilePath_1, clocLogFilePath_1], // use the same cloc data since the info coming from the cloc are not relevat for the tests
        );
        twoStreams
            .pipe(
                splitCommitsInTimeWindows(timeWindowLengthInDays),
                selectTimeWindowsPresentInAllRepos(),
                tap({
                    next: (timeWindows) => {
                        // the period of analysis (from 2019 to 2021) contains 3 commits in 3 different years
                        // only 1 of these commits happen in the same day of the same year
                        expect(timeWindows.length).equal(1);
                        // in the commit belonging to the same time window, one of the repos analyzed has 3 files committed
                        // while the other has only 2 files committed
                        const commitWithThreeFiles = timeWindows[0].entries.filter((e) => Object.keys(e).length === 3);
                        expect(commitWithThreeFiles.length).equal(1);
                        const commitWithTwoFiles = timeWindows[0].entries.filter((e) => Object.keys(e).length === 2);
                        expect(commitWithTwoFiles.length).equal(1);
                        // the commit with 3 files has one specific file
                        const aSpecificFilePath = 'hallo.java';
                        const aSpecificFile = timeWindows[0].entries.find((e) => Object.keys(e).length === 3)[
                            aSpecificFilePath
                        ];
                        // the data tested here come from the commit of the repo with 3 files in the commit
                        expect(aSpecificFile.linesAdded).equal(1);
                        expect(aSpecificFile.linesDeleted).equal(1);
                        expect(aSpecificFile.cloc).equal(5);
                        expect(aSpecificFile.totCommits).equal(3);
                    },
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(20000);
});

describe(`calculateFileTuplesPerTimeWindow`, () => {
    it(`returns the combination of files for all 3 timewindows since the 2 repos are actually the same and therefore the 3 commits which are present
    in one repo are necessarly present in the other one as well`, (done) => {
        const logName = 'a-git-repo';
        const logFilePath = path.join(process.cwd(), `/test-data/output/${logName}-commits.gitlog`);
        const clocLogPath = path.join(process.cwd(), `/test-data/output/${logName}-cloc.gitlog`);

        const timeWindowLengthInDays = 1;

        const twoFileStreams = twoStreamsFromSameRepo(logFilePath, clocLogPath);

        twoFileStreams
            .pipe(
                splitCommitsInTimeWindows(timeWindowLengthInDays),
                selectTimeWindowsPresentInAllRepos(),
                calculateFileTuplesPerTimeWindow(),
                tap({
                    next: (fileTuplesArrays) => {
                        // there are 3 elements in the array since the 2 repos are actually the same repo and therefore the 3 timewindows of one repo are found also
                        // in the second one
                        expect(fileTuplesArrays.length).equal(3);
                        // There is one timewindow where only one file is committed in both repos. Since the 2 repos are actually the same one,
                        // both commits have the same file path. Therefore, if the 2 commits have just one file, then the number
                        // of cominations is 1 * 1 = 1
                        const timeWindowWithOneFleaCommitted = fileTuplesArrays.filter(
                            (ft) => Object.keys(ft.fileTuples).length == 1,
                        );
                        expect(timeWindowWithOneFleaCommitted.length).equal(1);
                        expect(Object.keys(timeWindowWithOneFleaCommitted[0].fileTuples).length).equal(1);
                        const keyOfTheTuple = Object.keys(timeWindowWithOneFleaCommitted[0].fileTuples)[0];
                        const aFilePath = 'hallo.java';
                        expect(keyOfTheTuple).equal(`${aFilePath}${TUPLE_KEY_SEPARATOR}${aFilePath}`);
                    },
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(20000);
    it(`returns the combination of files for only 1 timewindow since the 2 repos have only 1 commit which is present in the same time window,
    the other 2 commits happen in differen days and therefore belong to different time windows`, (done) => {
        const logName_1 = 'a-git-repo';
        const logFilePath_1 = path.join(process.cwd(), `/test-data/output/${logName_1}-commits.gitlog`);
        const clocLogFilePath_1 = path.join(process.cwd(), `/test-data/output/${logName_1}-cloc.gitlog`);
        const logName_2 = 'a-git-repo-commits-shifted';
        const logFilePath_2 = path.join(process.cwd(), `/test-data/output/${logName_2}.gitlog`);

        const timeWindowLengthInDays = 1;

        const twoStreams = twoStreamsFromDifferentRepos(
            [logFilePath_1, logFilePath_2],
            [clocLogFilePath_1, clocLogFilePath_1], // use the same cloc data since the info coming from the cloc are not relevat for the tests
        );

        twoStreams
            .pipe(
                splitCommitsInTimeWindows(timeWindowLengthInDays),
                selectTimeWindowsPresentInAllRepos(),
                calculateFileTuplesPerTimeWindow(),
                tap({
                    next: (fileTuplesArrays) => {
                        // there is only one element in the array since the 2 repos have only one timewindow where both have at least one commit
                        expect(fileTuplesArrays.length).equal(1);
                        // in the only timewindow there are 6 fileTuples, since one repo has 3 files committed and the other one has 2 files committed
                        // therefore the number of their possible cominations is 3 * 2 = 6
                        expect(Object.keys(fileTuplesArrays[0].fileTuples).length).equal(6);
                    },
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(20000);
});

describe(`aggregateFileTuples`, () => {
    it(`returns 9 touples since the 2 repos (which happen to be the same one but this is not relevant for the test) have 3 files each which
    are committed in the same timewindows. There each of the 3 files of the first repo is combined with each of the 3 files of the second repo.
    the result so is a 3 * 3 = 9 combinantions`, (done) => {
        const logName = 'a-git-repo';
        const logFilePath = path.join(process.cwd(), `/test-data/output/${logName}-commits.gitlog`);
        const clocLogPath = path.join(process.cwd(), `/test-data/output/${logName}-cloc.gitlog`);

        const timeWindowLengthInDays = 1;

        const twoFileStreams = twoStreamsFromSameRepo(logFilePath, clocLogPath);

        twoFileStreams
            .pipe(
                splitCommitsInTimeWindows(timeWindowLengthInDays),
                selectTimeWindowsPresentInAllRepos(),
                calculateFileTuplesPerTimeWindow(),
                groupFileTuples(),
                tap({
                    next: (fileTuples) => {
                        // there are 9 elements in the dictionary since the 2 repos have 3 files each and each file of one repo is combined with each file
                        // of the other repo since all the files are committed in the same timewindow
                        expect(Object.keys(fileTuples).length).equal(9);
                        // each repo (which happen to be the same) has one file which is committed in 3 timewindows. The other 2 files for each repo
                        // are committed in just 2 time windows. Therefore, each combination of files appears in 2 time windows apart from the combination
                        // of the files which have 3 commits. This combination appears in 3 timewindows.
                        const fileInThreeCommits = 'hallo.java';
                        const tupleInThreeTimeWindow = Object.entries(fileTuples).filter(
                            ([k]) => k === `${fileInThreeCommits}${TUPLE_KEY_SEPARATOR}${fileInThreeCommits}`,
                        );
                        expect(tupleInThreeTimeWindow.length).equal(1);
                        const [, { tupleOccurrenciesInTimeWindow: howMany, files }] = tupleInThreeTimeWindow[0];
                        expect(howMany).equal(3);
                        expect(Object.keys(files).length).equal(2);
                        Object.keys(files).forEach((kf) => expect(kf.includes(fileInThreeCommits)).true);
                        Object.values(files).forEach((vf) => {
                            expect(vf.commits.length).equal(3);
                            // there are 3 files in the test data. 2 files are committed in 2 timewindows while the third file is committed in 3 timewindows.
                            // The 2 files which are just in 2 timewindows are in tuples that are found in the same 2 timewindows.
                            // So there are no commits of these 2 files which fall in timewindows where any of the tuples they belong to is not present.
                            // The same happen for the file which has 3 commits.
                            // This is the reason why tupleFileOccurrenciesRatio is always 1
                            expect(vf.tupleFileOccurrenciesRatio).equal(1);
                        });
                    },
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(20000);
    it(`returns 6 touples since the only timewindow which the 2 streams have in common contains 3 files from one repo and 2 files from
    the other repo, therefore this generates 3 * 2 = 6 combinations`, (done) => {
        const logName_1 = 'a-git-repo';
        const logFilePath_1 = path.join(process.cwd(), `/test-data/output/${logName_1}-commits.gitlog`);
        const clocLogFilePath_1 = path.join(process.cwd(), `/test-data/output/${logName_1}-cloc.gitlog`);
        const logName_2 = 'a-git-repo-commits-shifted';
        const logFilePath_2 = path.join(process.cwd(), `/test-data/output/${logName_2}.gitlog`);

        const timeWindowLengthInDays = 1;

        const twoStreams = twoStreamsFromDifferentRepos(
            [logFilePath_1, logFilePath_2],
            [clocLogFilePath_1, clocLogFilePath_1], // use the same cloc data since the info coming from the cloc are not relevat for the tests
        );

        twoStreams
            .pipe(
                splitCommitsInTimeWindows(timeWindowLengthInDays),
                selectTimeWindowsPresentInAllRepos(),
                calculateFileTuplesPerTimeWindow(),
                groupFileTuples(),
                tap({
                    next: (fileTuples) => {
                        expect(Object.keys(fileTuples).length).equal(6);
                        Object.values(fileTuples).forEach((t) => {
                            const { tupleOccurrenciesInTimeWindow: howMany, files } = t;
                            expect(howMany).equal(1);
                            expect(Object.keys(files).length).equal(2);
                            // Object.values(files).forEach((vf) => expect(vf.commits.length).equal(2));
                        });
                        const allFiles = Object.values(fileTuples).reduce(
                            (acc, val) => {
                                acc = [...acc, ...Object.values(val.files)];
                                return acc;
                            },
                            [] as {
                                repoIndex: number;
                                path: string;
                                cloc: number;
                                linesAdded: number;
                                linesDeleted: number;
                                totCommits?: number;
                                commits?: string[];
                            }[],
                        );
                        // there is one file which has 3 commits. This file appears in 2 tuples and therefore we find 2 occurrences
                        const filesWIthThreeCommits = allFiles.filter((f) => f.commits.length === 3);
                        expect(filesWIthThreeCommits.length).equal(2);
                        // All files which apper in the tuples generated by the time window which is present in all 2 repos have 2 commits
                        // apart 1. Since there are 6 tuples, each tuple has 2 files, so there are 12 files.
                        // 10 of such files have 2 commits
                        const filesWIthTwoCommits = allFiles.filter((f) => f.commits.length === 2);
                        expect(filesWIthTwoCommits.length).equal(10);
                    },
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(20000);
    it(`In these example repos what we see is that any time hallo-X.java is committed in a timewindow also hallo-Y.java is committed
    in the same timewindow. So 100% of the times hallo-X.java is committed in a timewindow, we encounter the tuple [hallo-X.java, hallo-Y.java]
    in the same timewindow.
    On the contrary, 50% of the times hallo-X.java is committed also good-by-Y.java is committed. Therefore 50% of the times hallo-X.java
    is committed in a timewindow we find the tuple [hallo-X.java, good-by-Y.java]

        REPO_1                                                              REPO_2
§§§1c8a199§§§2020-09-22§§§Picci-2§§§Picci§§§2020-09-22§§§first commit
1	1	hallo-X.java                                                        1	1	hallo-Y.java
1	1	good-by-X.java                                                      1	1	good-by-Y.java

§§§e4f5978§§§2021-09-01§§§Picci-3§§§Picci§§§2021-09-22§§§second commit
3	2	hallo-X.java                                                        3	2	hallo-Y.java
2	1	good-by-X.java


    `, (done) => {
        const logName_1 = 'a-git-repo-commits-X';
        const logFilePath_1 = path.join(process.cwd(), `/test-data/output/${logName_1}.gitlog`);
        const logName_2 = 'a-git-repo-commits-Y';
        const logFilePath_2 = path.join(process.cwd(), `/test-data/output/${logName_2}.gitlog`);

        const clocLogFilePath = path.join(process.cwd(), `/test-data/output/a-git-repo-cloc.gitlog`);

        const timeWindowLengthInDays = 1;

        const twoStreams = twoStreamsFromDifferentRepos(
            [logFilePath_1, logFilePath_2],
            [clocLogFilePath, clocLogFilePath], // use the same cloc data since the info coming from the cloc are not relevat for the tests
        );
        twoStreams
            .pipe(
                splitCommitsInTimeWindows(timeWindowLengthInDays),
                selectTimeWindowsPresentInAllRepos(),
                calculateFileTuplesPerTimeWindow(),
                groupFileTuples(),
                tap({
                    next: (fileTuples) => {
                        const aFileChangedOftenPath = 'hallo-X.java';
                        const aFileChangedNotSoOftenPath = 'good-by-Y.java';
                        const tuplesWithAFileChangedOften = Object.entries(fileTuples)
                            .filter(([tupleKey]) => tupleKey.includes(aFileChangedOftenPath))
                            .map(([, { files }]) => files);
                        // there are 2 tuples containing hallo-X.java, which are [hallo-X.java, hallo-Y.java] and [hallo-X.java, good-by-Y.java]
                        expect(tuplesWithAFileChangedOften.length).equal(2);
                        //
                        // check the tupleFileOccurrenciesRatio value in 2 different cases
                        //
                        // Select the tuple where both hallo-X.java and good-by-Y.java are present
                        const tupleWithAFileThatChangedOftenWithAFileThatChangedNotSoOften = Object.entries(fileTuples)
                            .filter(
                                ([tupleKey]) =>
                                    tupleKey.includes(aFileChangedOftenPath) &&
                                    tupleKey.includes(aFileChangedNotSoOftenPath),
                            )
                            // the array of dictionaries returned by the filter function contains only 1 dictionary
                            .map(([, { files }]) => files)[0];
                        // the tuple [hallo-X.java, good-by-Y.java] is encoutered only 1 time but hallo-X.java has been committed 2 times, so
                        // the tupleFileOccurrenciesRatio value for hallo-X.java in the [hallo-X.java, good-by-Y.java] tuple should be 0.5
                        console.log(tupleWithAFileThatChangedOftenWithAFileThatChangedNotSoOften);
                        const aFileChangedOften = Object.entries(
                            tupleWithAFileThatChangedOftenWithAFileThatChangedNotSoOften,
                        )
                            .filter(([k]) => k.includes(aFileChangedOftenPath))
                            .map(([, v]) => v)[0];
                        expect(aFileChangedOften.tupleFileOccurrenciesRatio).equal(0.5);
                        // the tuple [hallo-X.java, good-by-Y.java] is encoutered only 1 time and good-by-Y.java has been committed also only 1 time, so
                        // the tupleFileOccurrenciesRatio value for good-by-Y.java in the [hallo-X.java, good-by-Y.java] tuple should be 1
                        console.log(tupleWithAFileThatChangedOftenWithAFileThatChangedNotSoOften);
                        const aFileChangedNotSoOften = Object.entries(
                            tupleWithAFileThatChangedOftenWithAFileThatChangedNotSoOften,
                        )
                            .filter(([k]) => k.includes(aFileChangedNotSoOftenPath))
                            .map(([, v]) => v)[0];
                        expect(aFileChangedNotSoOften.tupleFileOccurrenciesRatio).equal(1);
                    },
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(20000);
});

describe(`flatFilesCsv`, () => {
    it(`generate an array of strings, each representing one file in a specific tuple, in csv format`, (done) => {
        const logName = 'a-git-repo';
        const logFilePath = path.join(process.cwd(), `/test-data/output/${logName}-commits.gitlog`);
        const clocLogPath = path.join(process.cwd(), `/test-data/output/${logName}-cloc.gitlog`);

        const timeWindowLengthInDays = 1;

        const twoFileStreams = twoStreamsFromSameRepo(logFilePath, clocLogPath);

        twoFileStreams
            .pipe(
                splitCommitsInTimeWindows(timeWindowLengthInDays),
                selectTimeWindowsPresentInAllRepos(),
                calculateFileTuplesPerTimeWindow(),
                groupFileTuples(),
                flatFilesCsv(),
                toArray(),
                tap({
                    next: (fileTuplesCsv) => {
                        // there are 9 tuples, each containing 2 files, plus the first line (the header)
                        expect(fileTuplesCsv.length).equal(19);
                    },
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    }).timeout(20000);
});

// returns one stream of File commit info

function oneStream(logName: string, clocLogPath: string) {
    return filesStream(logName, clocLogPath);
}

// returns two streams of File commits info, the streams notify the same data since the both come from the same repo log
function twoStreamsFromSameRepo(logName: string, clocLogPath: string) {
    return of([filesStream(logName, clocLogPath), filesStream(logName, clocLogPath)]);
}

// returns two streams of File commits info read from different repo logs
function twoStreamsFromDifferentRepos(logFilePaths: string[], clocLogFilePaths: string[]) {
    const [logFilePath_1, logFilePath_2] = logFilePaths;
    const [clocLogFilePath_1, clocLogFilePath_2] = clocLogFilePaths;

    return of([filesStream(logFilePath_1, clocLogFilePath_1), filesStream(logFilePath_2, clocLogFilePath_2)]);
}
