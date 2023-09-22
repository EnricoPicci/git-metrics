"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const path_1 = __importDefault(require("path"));
const operators_1 = require("rxjs/operators");
const load_commits_files_1 = require("../load/load-commits-files");
const load_multi_commits_files_1 = require("../load/load-multi-commits-files");
const files_query_1 = require("../query/files-query");
const repo_coupling_report_1 = require("../../1-D-reports/repo-coupling-report");
const repo_coupling_aggregate_1 = require("../../1-C-aggregate-in-memory/repo-coupling-aggregate");
const dictionary_utils_1 = require("../../../../0-tools/dictionary-utils/dictionary-utils");
describe(`timeWindowedFileCommitsDict`, () => {
    it(`creates the dictionary of timewindows with the info related to each file which has a commit in that timewindow.
    Since in the test data there are 3 commits with distance of one year, then there are 3 time windows`, (done) => {
        const logName = 'a-git-repo-commits';
        const logFilePath = path_1.default.join(process.cwd(), `/test-data/output/${logName}.gitlog`);
        const connectionString = 'mongodb://localhost:27017';
        const params = [logFilePath, connectionString, logName];
        const aFilePath = 'hallo.java';
        // first load the commits and the files
        const filesObs = oneStream(...params);
        filesObs
            .pipe((0, repo_coupling_aggregate_1.timeWindowedFileCommitsDict)(1, 1), (0, operators_1.tap)({
            next: (timeWindowDict) => {
                // TEST timeWindowDict
                // there are 3 commmits in the example used as test data
                (0, chai_1.expect)(Object.keys(timeWindowDict).length).equal(3);
                // there is one time window which has just one file
                const entriesWithJustOneFile = Object.values(timeWindowDict).filter((tw) => Object.keys(tw).length === 1);
                (0, chai_1.expect)(entriesWithJustOneFile.length).equal(1);
                (0, chai_1.expect)(entriesWithJustOneFile[0][aFilePath].path).equal(aFilePath);
                // the same file is present in all time windows
                Object.values(timeWindowDict).forEach((tw) => {
                    (0, chai_1.expect)(tw[aFilePath].path).equal(aFilePath);
                });
                // The total number of time windows found in the stream of commits is the same for all the files
                Object.values(timeWindowDict).forEach((tw) => {
                    Object.values(tw).forEach((f) => {
                        (0, chai_1.expect)(f.totalNumberOfTimeWindowsWithCommits).equal(3);
                    });
                });
                //
                // There is one file which is present in 3 timewindows, the other are present in 2
                const fileFoundInThreeTimeWindows = 'hallo.java';
                const allFiles = [];
                Object.values(timeWindowDict).forEach((tw) => {
                    Object.values(tw).forEach((f) => {
                        allFiles.push(f);
                    });
                });
                const filesFoundInThreeTimeWindows = allFiles.filter((f) => f.path === fileFoundInThreeTimeWindows);
                (0, chai_1.expect)(filesFoundInThreeTimeWindows.length).equal(3);
                filesFoundInThreeTimeWindows.forEach((f) => {
                    (0, chai_1.expect)(f.fileOccurrenciesInTimeWindows).equal(3);
                });
                // This is the test for the files which are present in 2 timewindows
                const filesNOTFoundInThreeTimeWindows = allFiles.filter((f) => f.path !== fileFoundInThreeTimeWindows);
                (0, chai_1.expect)(filesNOTFoundInThreeTimeWindows.length).equal(4);
                filesNOTFoundInThreeTimeWindows.forEach((f) => {
                    (0, chai_1.expect)(f.fileOccurrenciesInTimeWindows).equal(2);
                });
                //
                // in one time window there has been 1 line added and 1 line deleted in a specific file
                const anEntry = timeWindowDict[18527];
                const aFile = anEntry[aFilePath];
                (0, chai_1.expect)(aFile.linesAdded).equal(1);
                (0, chai_1.expect)(aFile.linesDeleted).equal(1);
                (0, chai_1.expect)(aFile.totCommits).equal(3);
                (0, chai_1.expect)(aFile.commits.length).equal(3);
            },
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(200000);
    it(`if the timeWindowLengthInDays is very big, all commits fall into the same timewindow`, (done) => {
        const logName = 'a-git-repo-commits';
        const logFilePath = path_1.default.join(process.cwd(), `/test-data/output/${logName}.gitlog`);
        const connectionString = 'mongodb://localhost:27017';
        const params = [logFilePath, connectionString, logName];
        const timeWindowLengthInDays = 5000;
        const aFilePath = 'hallo.java';
        // first load the commits and the files
        const filesObs = oneStream(...params);
        filesObs
            .pipe((0, repo_coupling_aggregate_1.timeWindowedFileCommitsDict)(timeWindowLengthInDays, 1), (0, operators_1.tap)({
            next: (timeWindowDict) => {
                // TEST timeWindowDict
                // there are 3 commmits but they all fall in the same timewindos, so there is only 1 timewindow
                (0, chai_1.expect)(Object.keys(timeWindowDict).length).equal(1);
                // The total number of time windows found in the stream of commits is the same for all the files
                Object.values(timeWindowDict).forEach((tw) => {
                    Object.values(tw).forEach((f) => {
                        (0, chai_1.expect)(f.totalNumberOfTimeWindowsWithCommits).equal(1);
                    });
                });
                //
                // All files are present in just 1 timewindow since there is just 1 timewindow
                const allFiles = [];
                Object.values(timeWindowDict).forEach((tw) => {
                    Object.values(tw).forEach((f) => {
                        allFiles.push(f);
                    });
                });
                allFiles.forEach((f) => {
                    (0, chai_1.expect)(f.fileOccurrenciesInTimeWindows).equal(1);
                });
                //
                // one specific file
                const anEntry = Object.values(timeWindowDict)[0];
                const aFile = anEntry[aFilePath];
                (0, chai_1.expect)(aFile.linesAdded).equal(13);
                (0, chai_1.expect)(aFile.linesDeleted).equal(3);
                (0, chai_1.expect)(aFile.totCommits).equal(3);
                (0, chai_1.expect)(aFile.commits.length).equal(3);
            },
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(200000);
});
describe(`splitCommittsInTimeWindows & selectTimeWindowsPresentInAllRepos`, () => {
    it(`Splits the commits into timewindows and select the timewindows for which there is at least one commit per each repo.
    Since we use, as input, an array of streams of commits which come from the SAME repo, it returns all the time windows. 
    In other words, we want to select the time windows that are present in 2 repos, but since the
    repos are the same, all time windows are present in one repo are also present in the other one and therfore we select all of them`, (done) => {
        const logName = 'a-git-repo-commits';
        const logFilePath = path_1.default.join(process.cwd(), `/test-data/output/${logName}.gitlog`);
        const connectionString = 'mongodb://localhost:27017';
        const params = [logFilePath, connectionString, logName];
        const timeWindowLengthInDays = 1;
        const twoFileStreams = twoStreamsFromSameRepo(...params);
        twoFileStreams
            .pipe((0, repo_coupling_aggregate_1.splitCommitsInTimeWindows)(timeWindowLengthInDays), (0, repo_coupling_aggregate_1.selectTimeWindowsPresentInAllRepos)(), (0, operators_1.tap)({
            next: (timeWindows) => {
                // the period of analysis (from 2019 to 2021) contains 3 commits in 3 different years
                // since we are using a timeWindowLengthInDays of 1, then the 3 commits clearly belongto 3 different
                // time windows
                (0, chai_1.expect)(timeWindows.length).equal(3);
                // each entries array in each time window contains a number of elements equal to the number of repos analyzed, which is 2
                timeWindows.forEach((tw) => {
                    (0, chai_1.expect)(tw.entries.length).equal(2);
                });
                // each entry contains 2 dictionaries, each containing the same references to the same files, due to the
                // fact that we are analyzing two streams of commits coming from the same repo
                timeWindows.forEach((tw) => {
                    const firstDict = tw.entries[0];
                    const secondDict = tw.entries[1];
                    (0, chai_1.expect)(Object.keys(firstDict).length).equal(Object.keys(secondDict).length);
                });
                // one of the commits contain just 1 file
                const commitsWithOneFile = timeWindows.filter((tw) => Object.keys(tw.entries[0]).length === 1);
                (0, chai_1.expect)(commitsWithOneFile.length).equal(1);
                // two of the commits contain 3 file
                const commitsWithThreeFiles = timeWindows.filter((tw) => Object.keys(tw.entries[0]).length === 3);
                (0, chai_1.expect)(commitsWithThreeFiles.length).equal(2);
            },
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(200000);
    it(`returns only 1 time window since the 2 repos have only 1 commit which is present in the same time window, the other 2 commits happen in different
    days and therefore belong to different time windows`, (done) => {
        const logName_1 = 'a-git-repo';
        const logFilePath_1 = path_1.default.join(process.cwd(), `/test-data/output/${logName_1}-commits.gitlog`);
        const clocLogFilePath_1 = path_1.default.join(process.cwd(), `/test-data/output/${logName_1}-cloc.gitlog`);
        const logName_2 = 'a-git-repo-commits-shifted';
        const logFilePath_2 = path_1.default.join(process.cwd(), `/test-data/output/${logName_2}.gitlog`);
        const connectionString = 'mongodb://localhost:27017';
        const timeWindowLengthInDays = 1;
        const twoStreams = twoStreamsFromDifferentRepos(connectionString, [logFilePath_1, logFilePath_2], [clocLogFilePath_1, clocLogFilePath_1]);
        twoStreams
            .pipe((0, repo_coupling_aggregate_1.splitCommitsInTimeWindows)(timeWindowLengthInDays), (0, repo_coupling_aggregate_1.selectTimeWindowsPresentInAllRepos)(), (0, operators_1.tap)({
            next: (timeWindows) => {
                // the period of analysis (from 2019 to 2021) contains 3 commits in 3 different years
                // only 1 of these commits happen in the same day of the same year
                (0, chai_1.expect)(timeWindows.length).equal(1);
                // in the commit belonging to the same time window, one of the repos analyzed has 3 files committed
                // while the other has only 2 files committed
                const commitWithThreeFiles = timeWindows[0].entries.filter((e) => Object.keys(e).length === 3);
                (0, chai_1.expect)(commitWithThreeFiles.length).equal(1);
                const commitWithTwoFiles = timeWindows[0].entries.filter((e) => Object.keys(e).length === 2);
                (0, chai_1.expect)(commitWithTwoFiles.length).equal(1);
                // the commit with 3 files has one specific file
                const aSpecificFilePath = 'hallo.java';
                const aSpecificFile = timeWindows[0].entries.find((e) => Object.keys(e).length === 3)[aSpecificFilePath];
                // the data tested here come from the commit of the repo with 3 files in the commit
                (0, chai_1.expect)(aSpecificFile.linesAdded).equal(1);
                (0, chai_1.expect)(aSpecificFile.linesDeleted).equal(1);
                (0, chai_1.expect)(aSpecificFile.cloc).equal(5);
                (0, chai_1.expect)(aSpecificFile.totCommits).equal(3);
            },
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(200000);
});
describe(`calculateFileTuplesPerTimeWindow`, () => {
    it(`returns the combination of files for all 3 timewindows since the 2 repos are actually the same and therefore the 3 commits which are present 
    in one repo are necessarly present in the other one as well`, (done) => {
        const logName = 'a-git-repo-commits';
        const logFilePath = path_1.default.join(process.cwd(), `/test-data/output/${logName}.gitlog`);
        const connectionString = 'mongodb://localhost:27017';
        const params = [logFilePath, connectionString, logName];
        const timeWindowLengthInDays = 1;
        twoStreamsFromSameRepo(...params)
            .pipe((0, repo_coupling_aggregate_1.splitCommitsInTimeWindows)(timeWindowLengthInDays), (0, repo_coupling_aggregate_1.selectTimeWindowsPresentInAllRepos)(), (0, repo_coupling_aggregate_1.calculateFileTuplesPerTimeWindow)(), (0, operators_1.tap)({
            next: (fileTuplesArrays) => {
                // there are 3 elements in the array since the 2 repos are actually the same repo and therefore the 3 timewindows of one repo are found also
                // in the second one
                (0, chai_1.expect)(fileTuplesArrays.length).equal(3);
                // There is one timewindow where only one file is committed in both repos. Since the 2 repos are actually the same one,
                // both commits have the same file path. Therefore, if the 2 commits have just one file, then the number
                // of cominations is 1 * 1 = 1
                const timeWindowWithOneFleaCommitted = fileTuplesArrays.filter((ft) => Object.keys(ft.fileTuples).length == 1);
                (0, chai_1.expect)(timeWindowWithOneFleaCommitted.length).equal(1);
                (0, chai_1.expect)(Object.keys(timeWindowWithOneFleaCommitted[0].fileTuples).length).equal(1);
                const keyOfTheTuple = Object.keys(timeWindowWithOneFleaCommitted[0].fileTuples)[0];
                const aFilePath = 'hallo.java';
                (0, chai_1.expect)(keyOfTheTuple).equal(`${aFilePath}${dictionary_utils_1.TUPLE_KEY_SEPARATOR}${aFilePath}`);
            },
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(200000);
    it(`returns the combination of files for only 1 timewindow since the 2 repos have only 1 commit which is present in the same time window, 
    the other 2 commits happen in differen days and therefore belong to different time windows`, (done) => {
        const logName_1 = 'a-git-repo';
        const logFilePath_1 = path_1.default.join(process.cwd(), `/test-data/output/${logName_1}-commits.gitlog`);
        const clocLogFilePath_1 = path_1.default.join(process.cwd(), `/test-data/output/${logName_1}-cloc.gitlog`);
        const logName_2 = 'a-git-repo-commits-shifted';
        const logFilePath_2 = path_1.default.join(process.cwd(), `/test-data/output/${logName_2}.gitlog`);
        const connectionString = 'mongodb://localhost:27017';
        const timeWindowLengthInDays = 1;
        const twoStreams = twoStreamsFromDifferentRepos(connectionString, [logFilePath_1, logFilePath_2], [clocLogFilePath_1, clocLogFilePath_1]);
        twoStreams
            .pipe((0, repo_coupling_aggregate_1.splitCommitsInTimeWindows)(timeWindowLengthInDays), (0, repo_coupling_aggregate_1.selectTimeWindowsPresentInAllRepos)(), (0, repo_coupling_aggregate_1.calculateFileTuplesPerTimeWindow)(), (0, operators_1.tap)({
            next: (fileTuplesArrays) => {
                // there is only one element in the array since the 2 repos have only one timewindow where both have at least one commit
                (0, chai_1.expect)(fileTuplesArrays.length).equal(1);
                // in the only timewindow there are 6 fileTuples, since one repo has 3 files committed and the other one has 2 files committed
                // therefore the number of their possible cominations is 3 * 2 = 6
                (0, chai_1.expect)(Object.keys(fileTuplesArrays[0].fileTuples).length).equal(6);
            },
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(200000);
});
describe(`aggregateFileTuples`, () => {
    it(`returns 9 touples since the 2 repos (which happen to be the same one but this is not relevant for the test) have 3 files each which
    are committed in the same timewindows. There each of the 3 files of the first repo is combined with each of the 3 files of the second repo.
    the result so is a 3 * 3 = 9 combinantions`, (done) => {
        const logName = 'a-git-repo-commits';
        const logFilePath = path_1.default.join(process.cwd(), `/test-data/output/${logName}.gitlog`);
        const connectionString = 'mongodb://localhost:27017';
        const params = [logFilePath, connectionString, logName];
        const timeWindowLengthInDays = 1;
        twoStreamsFromSameRepo(...params)
            .pipe((0, repo_coupling_aggregate_1.splitCommitsInTimeWindows)(timeWindowLengthInDays), (0, repo_coupling_aggregate_1.selectTimeWindowsPresentInAllRepos)(), (0, repo_coupling_aggregate_1.calculateFileTuplesPerTimeWindow)(), (0, repo_coupling_aggregate_1.groupFileTuples)(), (0, operators_1.tap)({
            next: (fileTuples) => {
                // there are 9 elements in the dictionary since the 2 repos have 3 files each and each file of one repo is combined with each file
                // of the other repo since all the files are committed in the same timewindow
                (0, chai_1.expect)(Object.keys(fileTuples).length).equal(9);
                // each repo (which happen to be the same) has one file which is committed in 3 timewindows. The other 2 files for each repo
                // are committed in just 2 time windows. Therefore, each combination of files appears in 2 time windows apart from the combination
                // of the files which have 3 commits. This combination appears in 3 timewindows.
                const fileInThreeCommits = 'hallo.java';
                const tupleInThreeTimeWindow = Object.entries(fileTuples).filter(([k]) => k === `${fileInThreeCommits}${dictionary_utils_1.TUPLE_KEY_SEPARATOR}${fileInThreeCommits}`);
                (0, chai_1.expect)(tupleInThreeTimeWindow.length).equal(1);
                const [, { tupleOccurrenciesInTimeWindow: howMany, files }] = tupleInThreeTimeWindow[0];
                (0, chai_1.expect)(howMany).equal(3);
                (0, chai_1.expect)(Object.keys(files).length).equal(2);
                Object.keys(files).forEach((kf) => (0, chai_1.expect)(kf.includes(fileInThreeCommits)).true);
                Object.values(files).forEach((vf) => {
                    (0, chai_1.expect)(vf.commits.length).equal(3);
                    // there are 3 files in the test data. 2 files are committed in 2 timewindows while the third file is committed in 3 timewindows.
                    // The 2 files which are just in 2 timewindows are in tuples that are found in the same 2 timewindows.
                    // So there are no commits of these 2 files which fall in timewindows where any of the tuples they belong to is not present.
                    // The same happen for the file which has 3 commits.
                    // This is the reason why tupleFileOccurrenciesRatio is always 1
                    (0, chai_1.expect)(vf.tupleFileOccurrenciesRatio).equal(1);
                });
            },
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(200000);
    it(`returns 6 touples since the only timewindow which the 2 streams have in common contains 3 files from one repo and 2 files from
    the other repo, therefore this generates 3 * 2 = 6 combinations`, (done) => {
        const logName_1 = 'a-git-repo';
        const logFilePath_1 = path_1.default.join(process.cwd(), `/test-data/output/${logName_1}-commits.gitlog`);
        const clocLogFilePath_1 = path_1.default.join(process.cwd(), `/test-data/output/${logName_1}-cloc.gitlog`);
        const logName_2 = 'a-git-repo-commits-shifted';
        const logFilePath_2 = path_1.default.join(process.cwd(), `/test-data/output/${logName_2}.gitlog`);
        const connectionString = 'mongodb://localhost:27017';
        const timeWindowLengthInDays = 1;
        const twoStreams = twoStreamsFromDifferentRepos(connectionString, [logFilePath_1, logFilePath_2], [clocLogFilePath_1, clocLogFilePath_1]);
        twoStreams
            .pipe((0, repo_coupling_aggregate_1.splitCommitsInTimeWindows)(timeWindowLengthInDays), (0, repo_coupling_aggregate_1.selectTimeWindowsPresentInAllRepos)(), (0, repo_coupling_aggregate_1.calculateFileTuplesPerTimeWindow)(), (0, repo_coupling_aggregate_1.groupFileTuples)(), (0, operators_1.tap)({
            next: (fileTuples) => {
                (0, chai_1.expect)(Object.keys(fileTuples).length).equal(6);
                Object.values(fileTuples).forEach((t) => {
                    const { tupleOccurrenciesInTimeWindow: howMany, files } = t;
                    (0, chai_1.expect)(howMany).equal(1);
                    (0, chai_1.expect)(Object.keys(files).length).equal(2);
                    // Object.values(files).forEach((vf) => expect(vf.commits.length).equal(2));
                });
                const allFiles = Object.values(fileTuples).reduce((acc, val) => {
                    acc = [...acc, ...Object.values(val.files)];
                    return acc;
                }, []);
                // there is one file which has 3 commits. This file appears in 2 tuples and therefore we find 2 occurrences
                const filesWIthThreeCommits = allFiles.filter((f) => f.commits.length === 3);
                (0, chai_1.expect)(filesWIthThreeCommits.length).equal(2);
                // All files which apper in the tuples generated by the time window which is present in all 2 repos have 2 commits
                // apart 1. Since there are 6 tuples, each tuple has 2 files, so there are 12 files.
                // 10 of such files have 2 commits
                const filesWIthTwoCommits = allFiles.filter((f) => f.commits.length === 2);
                (0, chai_1.expect)(filesWIthTwoCommits.length).equal(10);
            },
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(200000);
    it(`In these example repos what we see is that any time hallo-X.java is committed in a timewindow also hallo-Y.java is committed 
    in the same timewindow. So 100% of the times hallo-X.java is committed in a timewindow, we encounter the tuple [hallo-X.java, hallo-Y.java] 
    in the same timewindow.
    On the contrary, 50% of the times hallo-X.java is committed also good-by-Y.java is committed. Therefore 50% of the times hallo-X.java 
    is committed in a timewindow we find the tuple [hallo-X.java, good-by-Y.java]

        REPO_1                                                              REPO_2
§§§e4f5978§§§2021-09-01§§§Picci-3§§§Picci§§§2021-09-22§§§second commit
3	2	hallo-X.java                                                        3	2	hallo-Y.java
2	1	good-by-X.java

§§§1c8a199§§§2020-09-22§§§Picci-2§§§Picci§§§2020-09-22§§§first commit
1	1	hallo-X.java                                                        1	1	hallo-Y.java
1	1	good-by-X.java                                                      1	1	good-by-Y.java
    
    `, (done) => {
        const logName_1 = 'a-git-repo-commits-X';
        const logFilePath_1 = path_1.default.join(process.cwd(), `/test-data/output/${logName_1}.gitlog`);
        const logName_2 = 'a-git-repo-commits-Y';
        const logFilePath_2 = path_1.default.join(process.cwd(), `/test-data/output/${logName_2}.gitlog`);
        const clocLogFilePath = path_1.default.join(process.cwd(), `/test-data/output/a-git-repo-cloc.gitlog`);
        const connectionString = 'mongodb://localhost:27017';
        const timeWindowLengthInDays = 1;
        const twoStreams = twoStreamsFromDifferentRepos(connectionString, [logFilePath_1, logFilePath_2], [clocLogFilePath, clocLogFilePath]);
        twoStreams
            .pipe((0, repo_coupling_aggregate_1.splitCommitsInTimeWindows)(timeWindowLengthInDays), (0, repo_coupling_aggregate_1.selectTimeWindowsPresentInAllRepos)(), (0, repo_coupling_aggregate_1.calculateFileTuplesPerTimeWindow)(), (0, repo_coupling_aggregate_1.groupFileTuples)(), (0, operators_1.tap)({
            next: (fileTuples) => {
                const aFileChangedOftenPath = 'hallo-X.java';
                const aFileChangedNotSoOftenPath = 'good-by-Y.java';
                const tuplesWithAFileChangedOften = Object.entries(fileTuples)
                    .filter(([tupleKey]) => tupleKey.includes(aFileChangedOftenPath))
                    .map(([, { files }]) => files);
                // there are 2 tuples containing hallo-X.java, which are [hallo-X.java, hallo-Y.java] and [hallo-X.java, good-by-Y.java]
                (0, chai_1.expect)(tuplesWithAFileChangedOften.length).equal(2);
                //
                // check the tupleFileOccurrenciesRatio value in 2 different cases
                //
                // Select the tuple where both hallo-X.java and good-by-Y.java are present
                const tupleWithAFileThatChangedOftenWithAFileThatChangedNotSoOften = Object.entries(fileTuples)
                    .filter(([tupleKey]) => tupleKey.includes(aFileChangedOftenPath) &&
                    tupleKey.includes(aFileChangedNotSoOftenPath))
                    // the array of dictionaries returned by the filter function contains only 1 dictionary
                    .map(([, { files }]) => files)[0];
                // the tuple [hallo-X.java, good-by-Y.java] is encoutered only 1 time but hallo-X.java has been committed 2 times, so
                // the tupleFileOccurrenciesRatio value for hallo-X.java in the [hallo-X.java, good-by-Y.java] tuple should be 0.5
                console.log(tupleWithAFileThatChangedOftenWithAFileThatChangedNotSoOften);
                const aFileChangedOften = Object.entries(tupleWithAFileThatChangedOftenWithAFileThatChangedNotSoOften)
                    .filter(([k]) => k.includes(aFileChangedOftenPath))
                    .map(([, v]) => v)[0];
                (0, chai_1.expect)(aFileChangedOften.tupleFileOccurrenciesRatio).equal(0.5);
                // the tuple [hallo-X.java, good-by-Y.java] is encoutered only 1 time and good-by-Y.java has been committed also only 1 time, so
                // the tupleFileOccurrenciesRatio value for good-by-Y.java in the [hallo-X.java, good-by-Y.java] tuple should be 1
                console.log(tupleWithAFileThatChangedOftenWithAFileThatChangedNotSoOften);
                const aFileChangedNotSoOften = Object.entries(tupleWithAFileThatChangedOftenWithAFileThatChangedNotSoOften)
                    .filter(([k]) => k.includes(aFileChangedNotSoOftenPath))
                    .map(([, v]) => v)[0];
                (0, chai_1.expect)(aFileChangedNotSoOften.tupleFileOccurrenciesRatio).equal(1);
            },
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(200000);
});
describe(`flatFilesCsv`, () => {
    it(`generate an array of strings, each representing one file in a specific tuple, in csv format`, (done) => {
        const logName = 'a-git-repo-commits';
        const logFilePath = path_1.default.join(process.cwd(), `/test-data/output/${logName}.gitlog`);
        const connectionString = 'mongodb://localhost:27017';
        const params = [logFilePath, connectionString, logName];
        const timeWindowLengthInDays = 1;
        twoStreamsFromSameRepo(...params)
            .pipe((0, repo_coupling_aggregate_1.splitCommitsInTimeWindows)(timeWindowLengthInDays), (0, repo_coupling_aggregate_1.selectTimeWindowsPresentInAllRepos)(), (0, repo_coupling_aggregate_1.calculateFileTuplesPerTimeWindow)(), (0, repo_coupling_aggregate_1.groupFileTuples)(), (0, repo_coupling_report_1.flatFilesCsv)(), (0, operators_1.toArray)(), (0, operators_1.tap)({
            next: (fileTuplesCsv) => {
                // there are 9 tuples, each containing 2 files, plus the first line (the header)
                (0, chai_1.expect)(fileTuplesCsv.length).equal(19);
            },
        }))
            .subscribe({
            error: (err) => done(err),
            complete: () => done(),
        });
    }).timeout(200000);
});
// returns one stream of File commit info
function oneStream(logFilePath, connectionString, dbName) {
    // first load the commits and the files
    return (0, load_commits_files_1.loadAllCommitsFiles)(logFilePath, connectionString, dbName).pipe((0, operators_1.concatMap)(({ connectionString, dbName, filesCollection }) => (0, files_query_1.files)(connectionString, dbName, filesCollection)));
}
// returns two streams of File commits info, the streams notify the same data since the both come from the same repo log
function twoStreamsFromSameRepo(logFilePath, connectionString, dbName) {
    // first load the commits and the files
    return (0, load_commits_files_1.loadAllCommitsFiles)(logFilePath, connectionString, dbName).pipe(
    // the following map returns an array that contains 2 streams of commits relative to the same repo
    (0, operators_1.map)(({ connectionString, dbName, filesCollection }) => [
        (0, files_query_1.files)(connectionString, dbName, filesCollection),
        (0, files_query_1.files)(connectionString, dbName, filesCollection),
    ]));
}
// returns two streams of File commits info read from different repo logs
function twoStreamsFromDifferentRepos(connectionString, logFilePaths, clocLogFilePaths) {
    const [logFilePath_1, logFilePath_2] = logFilePaths;
    const [clocLogFilePath_1, clocLogFilePath_2] = clocLogFilePaths;
    // first load the commits and the files
    return (0, load_multi_commits_files_1.loadMultiAllCommitsFiles)(connectionString, [logFilePath_1, logFilePath_2], [clocLogFilePath_1, clocLogFilePath_2]).pipe((0, operators_1.map)((notification) => {
        const dbName = notification[0].dbName;
        const filesCollections = notification.map((n) => n.filesCollection);
        return filesCollections.map((fc) => (0, files_query_1.files)(connectionString, dbName, fc));
    }));
}
//# sourceMappingURL=repo-coupling-report.mongo.spec-mongo.js.map