"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const analyze_merge_requests_1 = require("./analyze-merge-requests");
const analyze_merge_requests_model_1 = require("./analyze-merge-requests.model");
describe(`getMinMaxYearMonth`, () => {
    it(`should return the min and max year_month values of an array`, () => {
        const min = '2019-01';
        const max = '2019-08';
        const yearMonths = ['2019-02', '2019-02', min, '2019-03', max, '2019-04', '2019-05'];
        const [minYearMonth, maxYearMonth] = (0, analyze_merge_requests_1.getMinMaxYearMonth)(yearMonths);
        (0, chai_1.expect)(minYearMonth).equal(min);
        (0, chai_1.expect)(maxYearMonth).equal(max);
    });
});
describe(`fillGapsInSummaryStatsByMonth`, () => {
    it(`should return a new SummaryStatsByMonth dict filled with all the year_months as keys`, () => {
        var _a;
        const min = '2019-01';
        const max = '2021-02';
        const mid = '2020-06';
        const midStats = (0, analyze_merge_requests_model_1.newStatsByMonth)();
        midStats.mergeRequestsCreated = 1;
        const summaryStatsByMonth = (0, analyze_merge_requests_model_1.newSummaryStatsByMonth)();
        summaryStatsByMonth.set(mid, midStats);
        (0, analyze_merge_requests_1.fillGapsInSummaryStatsByMonth)(summaryStatsByMonth, min, max);
        (0, chai_1.expect)(summaryStatsByMonth.get(min)).not.undefined;
        (0, chai_1.expect)(summaryStatsByMonth.get(max)).not.undefined;
        Object.values(summaryStatsByMonth.get(min)).forEach(value => {
            (0, chai_1.expect)(value === 0).to.be.true;
        });
        (0, chai_1.expect)((_a = summaryStatsByMonth.get(mid)) === null || _a === void 0 ? void 0 : _a.mergeRequestsCreated).equal(1);
        (0, chai_1.expect)(summaryStatsByMonth.size).equal(26);
    });
});
describe(`runAnalysis`, () => {
    it(`should return a MergeRequestsAnalysis filled with the right data`, () => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        const analysis = (0, analyze_merge_requests_1.runAnalysis)(mergRequests);
        // there are 4 MRs created in 2023-06 and 2 created in 2023-05 and 1 created in 2023-03 - this period spans 4 months
        (0, chai_1.expect)(analysis.summaryStatsByMonth.size).equal(4);
        (0, chai_1.expect)((_a = analysis.summaryStatsByMonth.get('2023-06')) === null || _a === void 0 ? void 0 : _a.mergeRequestsCreated).equal(4);
        (0, chai_1.expect)((_b = analysis.summaryStatsByMonth.get('2023-05')) === null || _b === void 0 ? void 0 : _b.mergeRequestsCreated).equal(2);
        (0, chai_1.expect)((_c = analysis.summaryStatsByMonth.get('2023-03')) === null || _c === void 0 ? void 0 : _c.mergeRequestsCreated).equal(1);
        // the 4 MRs created in 2023-06 are merged in the same month the ones created in 2023-05 are not merged
        // the one created in 2023-03 is merged in 2023-03
        (0, chai_1.expect)((_d = analysis.summaryStatsByMonth.get('2023-06')) === null || _d === void 0 ? void 0 : _d.mergeRequestsMerged).equal(4);
        (0, chai_1.expect)((_e = analysis.summaryStatsByMonth.get('2023-05')) === null || _e === void 0 ? void 0 : _e.mergeRequestsMerged).equal(0);
        (0, chai_1.expect)((_f = analysis.summaryStatsByMonth.get('2023-03')) === null || _f === void 0 ? void 0 : _f.mergeRequestsMerged).equal(1);
        // there 1 MRs closed in 2023-06 and 1 closed in 2023-05 and 0 closed in 2023-03
        (0, chai_1.expect)((_g = analysis.summaryStatsByMonth.get('2023-06')) === null || _g === void 0 ? void 0 : _g.mergeRequestsClosed).equal(1);
        (0, chai_1.expect)((_h = analysis.summaryStatsByMonth.get('2023-05')) === null || _h === void 0 ? void 0 : _h.mergeRequestsClosed).equal(1);
        (0, chai_1.expect)((_j = analysis.summaryStatsByMonth.get('2023-03')) === null || _j === void 0 ? void 0 : _j.mergeRequestsClosed).equal(0);
        // there are 2 MRs which are merged in 1 day and 1 MR which is merged in 3 days
        (0, chai_1.expect)(analysis.summaryStatsByNumDays.numMergeRequestsByNumOfDaysToMerge.size).equal(2);
        (0, chai_1.expect)(analysis.summaryStatsByNumDays.numMergeRequestsByNumOfDaysToMerge.get(1)).equal(3);
        (0, chai_1.expect)(analysis.summaryStatsByNumDays.numMergeRequestsByNumOfDaysToMerge.get(3)).equal(1);
        // there are 2 MRs which are closed in 2 days and 1 MR which is closed in 1 days
        (0, chai_1.expect)(analysis.summaryStatsByNumDays.numMergeRequestsByNumOfDaysToClose.size).equal(2);
        (0, chai_1.expect)(analysis.summaryStatsByNumDays.numMergeRequestsByNumOfDaysToClose.get(2)).equal(2);
        (0, chai_1.expect)(analysis.summaryStatsByNumDays.numMergeRequestsByNumOfDaysToClose.get(1)).equal(1);
        // there is 1 author of 5 MRs and another author of 2 MRs
        (0, chai_1.expect)(analysis.summaryStatsByAuthor.size).equal(2);
        (0, chai_1.expect)(analysis.summaryStatsByAuthor.get('chokri.ghalmi')).equal(5);
        (0, chai_1.expect)(analysis.summaryStatsByAuthor.get('sara.alberti')).equal(2);
    });
});
const mergRequests = [
    {
        "id": 33418,
        "iid": 2,
        "project_id": 278,
        "title": "PPPC-5354: remove generation source",
        "state": "merged",
        "created_at": "2023-06-16T16:06:01.156Z",
        "created_at_YYYY_MM": "2023-06",
        "updated_at": "2023-06-16T16:06:10.679Z",
        "merged_by": "chokri.ghalmi",
        "merged_at": "2023-06-16T16:06:10.062Z",
        "merged_at_YYYY_MM": "2023-06",
        "closed_at": '',
        "closed_at_YYYY_MM": "",
        "closed_by": '',
        "assignee": '',
        "author": "chokri.ghalmi",
        "draft": false,
        "work_in_progress": false,
        "web_url": "https://git.ad.rgigroup.com/auto/wspassptfauto/-/merge_requests/2",
        "time_estimate": 0,
        "time_spent": 0,
        "days_to_merge": 3,
        "days_to_close": null,
        "isLikelyBug": false
    },
    {
        "id": 33417,
        "iid": 1,
        "project_id": 276,
        "title": "PPPC-5354: remove generation source",
        "state": "merged",
        "created_at": "2023-06-16T16:04:29.476Z",
        "created_at_YYYY_MM": "2023-06",
        "updated_at": "2023-06-16T16:04:43.514Z",
        "merged_by": "chokri.ghalmi",
        "merged_at": "2023-06-16T16:04:42.947Z",
        "merged_at_YYYY_MM": "2023-06",
        "closed_at": '',
        "closed_at_YYYY_MM": "",
        "closed_by": '',
        "assignee": '',
        "author": "chokri.ghalmi",
        "draft": false,
        "work_in_progress": false,
        "web_url": "https://git.ad.rgigroup.com/auto/wsocto/-/merge_requests/1",
        "time_estimate": 0,
        "time_spent": 0,
        "days_to_merge": 1,
        "days_to_close": null,
        "isLikelyBug": false
    },
    {
        "id": 33417,
        "iid": 1,
        "project_id": 276,
        "title": "PPPC-5354: remove generation source",
        "state": "merged",
        "created_at": "2023-06-16T16:04:29.476Z",
        "created_at_YYYY_MM": "2023-06",
        "updated_at": "2023-06-16T16:04:43.514Z",
        "merged_by": "chokri.ghalmi",
        "merged_at": "2023-06-16T16:04:42.947Z",
        "merged_at_YYYY_MM": "2023-06",
        "closed_at": '',
        "closed_at_YYYY_MM": "",
        "closed_by": '',
        "assignee": '',
        "author": "chokri.ghalmi",
        "draft": false,
        "work_in_progress": false,
        "web_url": "https://git.ad.rgigroup.com/auto/wsocto/-/merge_requests/1",
        "time_estimate": 0,
        "time_spent": 0,
        "days_to_merge": 1,
        "days_to_close": null,
        "isLikelyBug": false
    },
    {
        "id": 33416,
        "iid": 1,
        "project_id": 434,
        "title": "PPPC-5354: remove generation source",
        "state": "merged",
        "created_at": "2023-06-16T15:52:50.638Z",
        "created_at_YYYY_MM": "2023-06",
        "updated_at": "2023-06-16T15:58:59.845Z",
        "merged_by": "chokri.ghalmi",
        "merged_at": "2023-06-16T15:58:59.034Z",
        "merged_at_YYYY_MM": "2023-06",
        "closed_at": '',
        "closed_at_YYYY_MM": "",
        "closed_by": '',
        "assignee": '',
        "author": "chokri.ghalmi",
        "draft": false,
        "work_in_progress": false,
        "web_url": "https://git.ad.rgigroup.com/auto/wsviasat/-/merge_requests/1",
        "time_estimate": 0,
        "time_spent": 0,
        "days_to_merge": null,
        "days_to_close": 2,
        "isLikelyBug": false
    },
    {
        "id": 32749,
        "iid": 26,
        "project_id": 266,
        "title": "[RQP-6142] - apertura per estensione",
        "state": "opened",
        "created_at": "2023-05-22T12:49:05.857Z",
        "created_at_YYYY_MM": "2023-05",
        "updated_at": "2023-05-22T12:49:08.763Z",
        "merged_at": '',
        "merged_at_YYYY_MM": "",
        "merged_by": '',
        "closed_at": '2023-06-18T15:58:59.034Z',
        "closed_at_YYYY_MM": "2023-06",
        "closed_by": '',
        "assignee": '',
        "author": "sara.alberti",
        "draft": false,
        "work_in_progress": false,
        "web_url": "https://git.ad.rgigroup.com/auto/passptfauto-it/-/merge_requests/26",
        "time_estimate": 0,
        "time_spent": 0,
        "days_to_merge": null,
        "days_to_close": 1,
        "isLikelyBug": false
    },
    {
        "id": 32750,
        "iid": 26,
        "project_id": 266,
        "title": "[RQP-6142] - apertura per estensione",
        "state": "opened",
        "created_at": "2023-05-22T12:49:05.857Z",
        "created_at_YYYY_MM": "2023-05",
        "updated_at": "2023-05-22T12:49:08.763Z",
        "merged_at": '',
        "merged_at_YYYY_MM": "",
        "merged_by": '',
        "closed_at": '2023-05-28T15:58:59.034Z',
        "closed_at_YYYY_MM": "2023-05",
        "closed_by": '',
        "assignee": '',
        "author": "sara.alberti",
        "draft": false,
        "work_in_progress": false,
        "web_url": "https://git.ad.rgigroup.com/auto/passptfauto-it/-/merge_requests/26",
        "time_estimate": 0,
        "time_spent": 0,
        "days_to_merge": null,
        "days_to_close": 2,
        "isLikelyBug": false
    },
    {
        "id": 33100,
        "iid": 1,
        "project_id": 276,
        "title": "MR added for the test data to create an MR in 2023-03",
        "state": "merged",
        "created_at": "2023-03-16T16:04:29.476Z",
        "created_at_YYYY_MM": "2023-03",
        "updated_at": "2023-03-16T16:04:43.514Z",
        "merged_by": "chokri.ghalmi",
        "merged_at": "2023-03-16T16:04:42.947Z",
        "merged_at_YYYY_MM": "2023-03",
        "closed_at": '',
        "closed_at_YYYY_MM": "",
        "closed_by": '',
        "assignee": '',
        "author": "chokri.ghalmi",
        "draft": false,
        "work_in_progress": false,
        "web_url": "https://git.ad.rgigroup.com/auto/wsocto/-/merge_requests/1",
        "time_estimate": 0,
        "time_spent": 0,
        "days_to_merge": 1,
        "days_to_close": null,
        "isLikelyBug": false
    },
];
//# sourceMappingURL=analyze-merge-requests.spec.js.map