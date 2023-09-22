"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toMergeRequestCompact = exports.readMergeRequestsForGroup = void 0;
const merge_request_model_1 = require("./merge-request.model");
const paged_command_1 = require("./paged-command");
function readMergeRequestsForGroup(gitLabUrl, token, groupId) {
    const command = listMergeRequestsCommand(gitLabUrl, groupId);
    return (0, paged_command_1.runPagedCommand)(command, token);
}
exports.readMergeRequestsForGroup = readMergeRequestsForGroup;
function toMergeRequestCompact(mergeRequests) {
    const mergeRequestsCompact = mergeRequests.map(mergeRequest => {
        return (0, merge_request_model_1.newMergeRequestCompact)(mergeRequest);
    });
    return mergeRequestsCompact;
}
exports.toMergeRequestCompact = toMergeRequestCompact;
function listMergeRequestsCommand(gitLabUrl, groupId) {
    return `https://${gitLabUrl}/api/v4/groups/${groupId}/merge_requests?state=all&per_page=100`;
}
//# sourceMappingURL=merge-requests.functions.js.map