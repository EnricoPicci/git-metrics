import { from, map, reduce, mergeMap, concatMap, last, tap, filter } from 'rxjs';
import * as XLSX from 'xlsx';
import { currentTimestampYYYYMMDDhhmmss } from '../tools/dates/timestamp';
import { toCsvObs } from '@enrico.piccinin/csv-tools';
import { appendFileObs } from 'observable-fs';

export function calculateCodeTurnoverForPackages(xlsFilePath: string, sheetName: string, outdir: string) {
    // Read the Excel file
    const workbook = XLSX.readFile(xlsFilePath);
    const _sheetName = sheetName ? sheetName : workbook.SheetNames[0];
    const sheet = workbook.Sheets[_sheetName];
    const options: XLSX.Sheet2JSONOpts = { header: 0 };
    const data = XLSX.utils.sheet_to_json(sheet, options) as any[];

    // Convert data to observable
    const data$ = from(data);

    const repoPackageNameSeparator = '&&&';
        
    // Calculate the size of each package
    const packageSize$ = data$.pipe(
        tap(row => {
            // we are expecting to find 3 specific columns: repo, file, file_code_turnover
            // if the columns are not found, the code will throw an error
            if (!row.repo || !row.file || row.file_code_turnover == undefined) {
                throw new Error(`The columns repo, file, and file_code_turnover are required in the input excel file
json: ${JSON.stringify(row, null, 2)}`);
            }
        }),
        filter(row => !row.maybe_mass_refact && !row.maybe_generated && !row.massive_remove),
        map(row => {
            const repo = row.repo as string;
            const file = row.file as string;
            const codeTurnover = row.file_code_turnover as number;
            const _packageName = file.split('/').slice(0, -1).join('/');
            // add the repo to the package name so that later we can split it back and add the repo to the output records
            const packageName = `${repo}${repoPackageNameSeparator}${repo}${_packageName}`;
            return { packageName, codeTurnover };
        }),
        reduce((acc, { packageName, codeTurnover }) => {
            if (!acc[packageName]) {
                acc[packageName] = 0;
            }
            acc[packageName] += codeTurnover;
            return acc;
        }, {} as { [key: string]: number })
    );

    // Calculate the size of each package and its sub-packages
    const packageAndSubpackageSize$ = packageSize$.pipe(
        mergeMap(packageSize => from(Object.keys(packageSize)).pipe(
            map(repoAndPackageName => {
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
            }),
        ))
    );

    // Write the results to a new Excel file
    const _outdir = outdir ? outdir : './';
    const timestampYYYYMMDDhhmmss = currentTimestampYYYYMMDDhhmmss();
    const outputFilePath = `${_outdir}/code-turnover-packages-${timestampYYYYMMDDhhmmss}.csv`;
    return packageAndSubpackageSize$.pipe(
        toCsvObs(),
        concatMap(result => {
            return appendFileObs(outputFilePath, `${result}\n`);
        }),
        last(),
        map(() => {
            console.log(`Results written to ${outputFilePath}`);
            return outputFilePath;
        })
    );
}