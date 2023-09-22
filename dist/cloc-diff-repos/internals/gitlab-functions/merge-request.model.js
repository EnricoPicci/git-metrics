"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.newMergeRequestCompact = void 0;
function newMergeRequestCompact(mergeRequest) {
    var _a, _b, _c, _d, _e, _f;
    const title = mergeRequest.title.replaceAll(',', '-');
    const mergeRequestCsv = {
        id: mergeRequest.id,
        iid: mergeRequest.iid,
        project_id: mergeRequest.project_id,
        title,
        state: mergeRequest.state,
        created_at: mergeRequest.created_at,
        created_at_YYYY_MM: yyyy_mm(mergeRequest.created_at),
        updated_at: mergeRequest.updated_at,
        merged_by: (_a = mergeRequest.merged_by) === null || _a === void 0 ? void 0 : _a.username,
        merged_at: mergeRequest.merged_at,
        merged_at_YYYY_MM: yyyy_mm(mergeRequest.merged_at),
        closed_by: (_b = mergeRequest.closed_by) === null || _b === void 0 ? void 0 : _b.username,
        closed_at: mergeRequest.closed_at,
        closed_at_YYYY_MM: yyyy_mm(mergeRequest.closed_at),
        author: (_c = mergeRequest.author) === null || _c === void 0 ? void 0 : _c.username,
        assignee: (_d = mergeRequest.assignee) === null || _d === void 0 ? void 0 : _d.username,
        draft: false,
        work_in_progress: false,
        web_url: mergeRequest.web_url,
        time_estimate: (_e = mergeRequest.time_stats) === null || _e === void 0 ? void 0 : _e.time_estimate,
        time_spent: (_f = mergeRequest.time_stats) === null || _f === void 0 ? void 0 : _f.total_time_spent,
        days_to_merge: daysBetween(mergeRequest.created_at, mergeRequest.merged_at),
        days_to_close: daysBetween(mergeRequest.created_at, mergeRequest.closed_at),
        isLikelyBug: isLikelyBug(mergeRequest),
    };
    return mergeRequestCsv;
}
exports.newMergeRequestCompact = newMergeRequestCompact;
function daysBetween(from, to) {
    if (!from || !to) {
        return null;
    }
    const diffInMs = new Date(to).getTime() - new Date(from).getTime();
    const diff = Math.round(diffInMs / (1000 * 60 * 60 * 24));
    return diff;
}
function yyyy_mm(date) {
    if (!date) {
        return '';
    }
    return date.slice(0, 7);
}
function isLikelyBug(mergeRequest) {
    const title = mergeRequest.title.toLowerCase();
    const isBug = title.includes('bug') || title.includes('fix');
    return isBug;
}
//# sourceMappingURL=merge-request.model.js.map