"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const path_1 = __importDefault(require("path"));
const calculate_code_turnover_for_packages_1 = require("./calculate-code-turnover-for-packages");
const rxjs_1 = require("rxjs");
describe(`calculateCodeTurnoverForPackages`, () => {
    it(`calculate the package size from code turnover of files`, (done) => {
        const currentDir = process.cwd();
        const filePath = path_1.default.join(currentDir, 'test-data', 'code-turnover', 'code-turnover-s.xlsx');
        const sheetName = 'code-turnover';
        const outdir = 'out';
        const header = 'packageName,packageSize,packageAndSubpackageSize,repo';
        const expectedOutput = [
            header,
            "core-party-services-api-providers/src/main/java/com/abc_corp/core/rs/party/impl,7,7,../../temp/app_2024_10_18/module_1/Party_Services",
            "src/main/java/com/abc_corp/printgateway/core/utils,1,1,../../temp/app_2024_10_18/appdoc/appdoc/print-gateway",
            "src/main/java/com/abc_corp/printgateway,2,3,../../temp/app_2024_10_18/appdoc/appdoc/print-gateway",
            "src/main/java/com/abc_corp/rs/area/boundary,4,41,../../temp/app_2024_10_18/module_2/rest-services",
            "src/main/java/com/abc_corp/rs/area/boundary/bean,37,37,../../temp/app_2024_10_18/module_2/rest-services",
            "src/main/java/it/rgi/seiimpl/appmodule_2,13,19,../../temp/app_2024_10_18/module_2/appmodule_2impl",
            "src/main/java/it/rgi/seiimpl/appmodule_2/annulli,4,4,../../temp/app_2024_10_18/module_2/appmodule_2impl",
            "src/main/java/it/rgi/seiimpl/appmodule_2/services,2,2,../../temp/app_2024_10_18/module_2/appmodule_2impl",
        ];
        let outputFilePath;
        (0, calculate_code_turnover_for_packages_1.calculateCodeTurnoverForPackages)(filePath, sheetName, outdir).pipe((0, rxjs_1.tap)({
            next: (outFile) => {
                console.log(outFile);
                (0, chai_1.expect)(outFile).to.be.a('string');
                outputFilePath = outFile;
            },
            error: (err) => {
                console.error(err);
                done(err);
            },
            complete: () => {
                // read the output file
                console.log(`Reading the output file: ${outputFilePath}`);
                const fs = require('fs');
                const data = fs.readFileSync(outputFilePath, 'utf8');
                const lines = data.split('\n').filter((line) => line.trim().length > 0);
                (0, chai_1.expect)(lines).to.have.lengthOf(expectedOutput.length);
                for (let i = 0; i < expectedOutput.length; i++) {
                    (0, chai_1.expect)(lines[i]).to.be.equal(expectedOutput[i]);
                }
                done();
            }
        })).subscribe();
    }).timeout(5000);
});
//# sourceMappingURL=calculate-code-turnover-for-packages.spec.js.map