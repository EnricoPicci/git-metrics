"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REPORT_CONFIG = void 0;
exports.REPORT_CONFIG = {
    // *************** CONFIGURATION FOR MORE THAN ONE REPORT ******************************************************
    // percentage considered as threshold, e.g. "10 files contribute to 80% of the churn"
    defaultPercentageThreshold: 80,
    // *************************************************************************************************************
    // *************** FILES CHURN REPORT CONFIGURATION ************************************************************
    // how many files have to be considered in the list of top contributors to the churn stored in the files churn report
    defaultTopChurnFilesListSize: 5,
    // *************************************************************************************************************
    // *************** AUTHORS CHURN REPORT CONFIGURATION **********************************************************
    // how many authors have to be considered in the list of top contributors to the churn stored in the author churn report
    defaultTopChurnAuthorsListSize: 5,
    // *************************************************************************************************************
    // *************** MODULES CHURN REPORT CONFIGURATION **********************************************************
    // how many modules have to be considered in the list of top contributors to the churn
    defaultTopChurnModulesListSize: 5,
    // *************************************************************************************************************
    // *************** FILES AUTHORS REPORT CONFIGURATION **********************************************************
    // the minumun number of authors equal or below which a file is signalled in the files-authors report considerations
    minNumberOfAuthorsThreshold: 1,
    // the maximum number of authors above which a file is signalled in the files-authors report considerations
    maxNumberOfAuthorsThreshold: 3,
    // *************************************************************************************************************
    // *************** DEPTH IN FILES COUPLING REPORT CONFIGURATION **********************************************************
    // Files in the coupling report are sorted by the numebr of commits (the more commits the more work has been performed on them).
    // Starting from the file with highest number of commits, the depth finds the lowest number of commits we want to consider.
    // For instance, if the number of commits in descending order is [20, 18, 15, 12, 10, ...] and the depth is 3, then we consider
    // only those files which show a number of commits higher than 15.
    depthInFilesCoupling: 10,
    // *************************************************************************************************************
    // *************** TIME WINDOW IN REPO COUPLING REPORT CONFIGURATION **********************************************************
    // When analysing different repos to try to identify patterns which can hide coupling we need to group the commits that happened for each
    // file for each time window into which we split the period of the analysis. The length of each time window is determined
    // by the timeWindowLengthInDays parameter
    timeWindowLengthInDays: 1,
    // *************************************************************************************************************
};
//# sourceMappingURL=report-config.js.map