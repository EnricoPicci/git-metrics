"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterFilesWithMinNumOfCommits = exports.couplingList = exports.couplingDict = exports.fileCoupling = void 0;
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
// receives a stream of FileGitCommitEnriched objects and returns a stream of FileCoupling objects
function fileCoupling(commits, depthInFilesCoupling, after) {
    return couplingDict(commits, after).pipe(couplingList(), filterFilesWithMinNumOfCommits(depthInFilesCoupling), (0, operators_1.concatMap)((couplings) => (0, rxjs_1.from)(couplings)));
}
exports.fileCoupling = fileCoupling;
// builds a dictionary where there is an entry for each file present in the stream of commits received
// for each file it calculates in how many commits the file itself is present in and also how many times that file was present
// together with any other file with which it was in the same commit at least once
// exported only for testing purposes
function couplingDict(commits, after) {
    const couplingDict = {};
    return commits.pipe((0, operators_1.reduce)((commitAcc, commit) => {
        if (commit.committerDate < after) {
            return commitAcc;
        }
        // the total number of commit is incremented
        commitAcc.totNumberOfCommits++;
        // analize all the files committed with the commit and adjust the commit map accordingly
        commit.files.forEach((fileInCommit) => {
            let fileInDict = commitAcc.couplingDict[fileInCommit.path];
            if (!fileInDict) {
                // if this is the first time we encounter a file, then we add it to the dictionary
                fileInDict = Object.assign(Object.assign({}, fileInCommit), { totCommitForFile: 0, togetherWith: {} });
                // clean lines added and deleted since they are incremented outside the if block
                fileInDict.linesAdded = 0;
                fileInDict.linesDeleted = 0;
                commitAcc.couplingDict[fileInCommit.path] = fileInDict;
            }
            // the file found in the commit is already present in the dictionary
            // in this case we increment by 1 the number of commits for the file and increment also linesAdded and linesDeleted
            fileInDict.totCommitForFile++;
            fileInDict.linesAdded = fileInCommit.linesAdded + fileInDict.linesAdded;
            fileInDict.linesDeleted = fileInCommit.linesDeleted + fileInDict.linesDeleted;
            // for all the files that are in the commit increase the howManyTimes counter
            commit.files.forEach((f) => {
                if (f.path !== fileInDict.path) {
                    let fCoup = fileInDict.togetherWith[f.path];
                    if (!fCoup) {
                        fCoup = { path: f.path, howManyTimes: 0 };
                        fileInDict.togetherWith[f.path] = fCoup;
                    }
                    fCoup.howManyTimes++;
                }
            });
        });
        return commitAcc;
    }, { couplingDict, totNumberOfCommits: 0 }));
}
exports.couplingDict = couplingDict;
// Builds a list of coupling info. Each entry in the list represent a pair of files which have been committed together in the same commit at
// least once.
// Each object in the list contains the names of the 2 files, the total commits of each file, how many times the coupled file (i.e. the second file)
// has been present in a commit where the first file was present
// exported only for testing purposes
function couplingList() {
    const numberOfCommitsForAllFiles = [];
    return (0, rxjs_1.pipe)((0, operators_1.map)(({ couplingDict, totNumberOfCommits }) => {
        const listOfCouplings = Object.values(couplingDict).reduce((couplingList, fileInDict) => {
            numberOfCommitsForAllFiles.push(fileInDict.totCommitForFile);
            const aFile = Object.assign({}, fileInDict);
            delete aFile.togetherWith;
            const couplingListForOneFile = Object.values(fileInDict.togetherWith).reduce((couplingForOneFile, coupledFileInfo) => {
                const totCommitsForCoupledFile = couplingDict[coupledFileInfo.path].totCommitForFile;
                const couplingInfo = {
                    coupledFile: coupledFileInfo.path,
                    totCommitsForCoupledFile,
                    howManyTimes: coupledFileInfo.howManyTimes,
                };
                const couplingEntry = Object.assign(Object.assign(Object.assign({}, aFile), couplingInfo), { totNumberOfCommits });
                couplingForOneFile.push(couplingEntry);
                return couplingForOneFile;
            }, []);
            couplingList = [...couplingList, ...couplingListForOneFile];
            return couplingList;
        }, []);
        return { listOfCouplings, numberOfCommitsForAllFiles };
    }));
}
exports.couplingList = couplingList;
// filter the files which have a minimum number of commits. This minimum number is calculated using the depthInFilesCoupling parameter
// exported only for testing purposes
function filterFilesWithMinNumOfCommits(depthInFilesCoupling) {
    return (0, rxjs_1.pipe)((0, operators_1.map)(({ listOfCouplings, numberOfCommitsForAllFiles, }) => {
        // numberOfCommitsForAllFilesSorted is an array containing the number of commits for each file
        const numberOfCommitsForAllFilesSorted = numberOfCommitsForAllFiles.sort((a, b) => b - a);
        // we take the top numbers of commits based on the value of depthInFilesCoupling
        const topNumbersOfCommits = numberOfCommitsForAllFilesSorted.slice(0, depthInFilesCoupling);
        // the minimum number of commits to consider is calculated as the last number of the topNumbersOfCommits array
        // in the almost exclusively theretical case we have a number of files in the repo less than depthInFilesCoupling
        // then the threshold is set to 0, i.e. there is no threshold
        const threshold = topNumbersOfCommits.length >= depthInFilesCoupling
            ? topNumbersOfCommits[depthInFilesCoupling - 1]
            : 0;
        // we consider the files which have at least a number of commits equal to the threshold calculated
        const _filteredList = listOfCouplings.filter((coupling) => coupling.totCommitsForCoupledFile >= threshold && coupling.totCommitForFile >= threshold);
        const filteredList = _filteredList.map((coupling) => {
            const howManyTimes_vs_totCommits = parseFloat(((coupling.howManyTimes / coupling.totCommitsForCoupledFile) * 100).toFixed(2));
            return Object.assign(Object.assign({}, coupling), { howManyTimes_vs_totCommits });
        });
        const filteredListSorted = filteredList.sort((a, b) => b.howManyTimes_vs_totCommits - a.howManyTimes_vs_totCommits);
        return filteredListSorted;
    }));
}
exports.filterFilesWithMinNumOfCommits = filterFilesWithMinNumOfCommits;
//# sourceMappingURL=file-coupling-aggregate.js.map