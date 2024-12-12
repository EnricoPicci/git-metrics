"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateCodeTurnoverForPackages = void 0;
const rxjs_1 = require("rxjs");
const XLSX = __importStar(require("xlsx"));
const timestamp_1 = require("../tools/dates/timestamp");
const csv_tools_1 = require("@enrico.piccinin/csv-tools");
const observable_fs_1 = require("observable-fs");
function calculateCodeTurnoverForPackages(xlsFilePath, sheetName, outdir) {
    // Read the Excel file
    const workbook = XLSX.readFile(xlsFilePath);
    const _sheetName = sheetName ? sheetName : workbook.SheetNames[0];
    const sheet = workbook.Sheets[_sheetName];
    const options = { header: 0 };
    const data = XLSX.utils.sheet_to_json(sheet, options);
    // Convert data to observable
    const data$ = (0, rxjs_1.from)(data);
    const repoPackageNameSeparator = '&&&';
    // Calculate the size of each package
    const packageSize$ = data$.pipe((0, rxjs_1.tap)(row => {
        // we are expecting to find 3 specific columns: repo, file, file_code_turnover
        // if the columns are not found, the code will throw an error
        if (!row.repo || !row.file || row.file_code_turnover == undefined) {
            throw new Error(`The columns repo, file, and file_code_turnover are required in the input excel file
json: ${JSON.stringify(row, null, 2)}`);
        }
    }), (0, rxjs_1.filter)(row => !row.maybe_mass_refact && !row.maybe_generated && !row.massive_remove), (0, rxjs_1.map)(row => {
        const repo = row.repo;
        const file = row.file;
        const codeTurnover = row.file_code_turnover;
        const _packageName = file.split('/').slice(0, -1).join('/');
        // add the repo to the package name so that later we can split it back and add the repo to the output records
        const packageName = `${repo}${repoPackageNameSeparator}${repo}${_packageName}`;
        return { packageName, codeTurnover };
    }), (0, rxjs_1.reduce)((acc, { packageName, codeTurnover }) => {
        if (!acc[packageName]) {
            acc[packageName] = 0;
        }
        acc[packageName] += codeTurnover;
        return acc;
    }, {}));
    // Calculate the size of each package and its sub-packages
    const packageAndSubpackageSize$ = packageSize$.pipe((0, rxjs_1.mergeMap)(packageSize => (0, rxjs_1.from)(Object.keys(packageSize)).pipe((0, rxjs_1.map)(repoAndPackageName => {
        let totalSize = packageSize[repoAndPackageName];
        Object.keys(packageSize).forEach(otherPackageName => {
            if (otherPackageName.startsWith(repoAndPackageName + '/')) {
                totalSize += packageSize[otherPackageName];
            }
        });
        const parts = repoAndPackageName.split(repoPackageNameSeparator);
        const repo = parts[0];
        const _packageName = parts[1];
        // remove the repo from the package name
        const packageName = _packageName.slice(repo.length);
        return { packageName, packageSize: packageSize[repoAndPackageName], packageAndSubpackageSize: totalSize, repo };
    }))));
    // Write the results to a new Excel file
    const _outdir = outdir ? outdir : './';
    const timestampYYYYMMDDhhmmss = (0, timestamp_1.currentTimestampYYYYMMDDhhmmss)();
    const outputFilePath = `${_outdir}/code-turnover-packages-${timestampYYYYMMDDhhmmss}.csv`;
    return packageAndSubpackageSize$.pipe((0, csv_tools_1.toCsvObs)(), (0, rxjs_1.concatMap)(result => {
        return (0, observable_fs_1.appendFileObs)(outputFilePath, `${result}\n`);
    }), (0, rxjs_1.last)(), (0, rxjs_1.map)(() => {
        console.log(`Results written to ${outputFilePath}`);
        return outputFilePath;
    }));
}
exports.calculateCodeTurnoverForPackages = calculateCodeTurnoverForPackages;
//# sourceMappingURL=calculate-code-turnover-for-packages.js.map