"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanParamsForReport = void 0;
function cleanParamsForReport(report) {
    const cleanParams = Object.assign({}, report.params.val);
    const cleanConnectionString = report.params.val.connectionString.split('//')[1];
    cleanParams.connectionString = cleanConnectionString;
    report.params.val = cleanParams;
    return report;
}
exports.cleanParamsForReport = cleanParamsForReport;
//# sourceMappingURL=mongo-report.js.map