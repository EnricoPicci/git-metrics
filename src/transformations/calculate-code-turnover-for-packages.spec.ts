import { expect } from 'chai';
import path from 'path';
import { calculateCodeTurnoverForPackages } from './calculate-code-turnover-for-packages';
import { tap } from 'rxjs';

describe(`calculateCodeTurnoverForPackages`, () => {
    it(`calculate the package size from code turnover of files`, (done) => {
        const currentDir = process.cwd();
        const filePath = path.join(currentDir, 'test-data', 'code-turnover', 'code-turnover-s.xlsx');
        const sheetName = 'code-turnover';
        const outdir = 'out'
        
        const header = 'packageName,packageSize,packageAndSubpackageSize,repo'
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
        ]

        let outputFilePath: string;
        calculateCodeTurnoverForPackages(filePath, sheetName, outdir).pipe(
            tap({
                next: (outFile) => {
                    console.log(outFile);
                    expect(outFile).to.be.a('string');
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
                    const lines = data.split('\n').filter((line: string) => line.trim().length > 0);
                    expect(lines).to.have.lengthOf(expectedOutput.length);
                    for (let i = 0; i < expectedOutput.length; i++) {
                        expect(lines[i]).to.be.equal(expectedOutput[i]);
                    }
                    done();
                }
            }),
        ).subscribe();
    }).timeout(5000);
});