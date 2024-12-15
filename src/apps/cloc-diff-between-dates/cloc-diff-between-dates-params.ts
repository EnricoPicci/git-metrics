import fs from "fs"
import { MarkForKeywordsInstruction } from "../../filters-markers/mark-csv"

// ClocDiffBetweenDatesParamsClass is a class that implements the parameters for the cloc-diff-between-dates app
// it has a static method fromJSON that takes a json object and returns an instance of the class
// it has a static method fromJSONFile that takes a file path and returns an instance of the class
// This is an example of the content of the json file:
/*
{
    "folderPath": "../../temp/my-repo",
    "outDir": "../../temp/out",
    "fromDate": "2024-01-01",
    "toDate": "2024-12-11",
    "languages": ["Java", "TypeScript", "Kotlin"],
    "creationDateCsvFilePath": "./creation-date.csv",
    "excludeRepoPaths": ["*db*", "*node_modules*"],
    "markForKeywordsInstruction": [
        {
            "searchFieldName": "file",
            "markFieldName": "contains_generated",
            "keywords": ["generated", "metadata"]
        },
        {
            "searchFieldName": "file",
            "markFieldName": "contains_impl_stub",
            "keywords": ["impl", "stub"]
        }
    ]
}
*/
export class ClocDiffBetweenDatesParams {
    folderPath: string = ''
    outDir: string = ''
    fromDate: string = ''
    toDate: string = ''
    languages: string[] = []
    creationDateCsvFilePath: string = ''
    excludeRepoPaths: string[] = []
    markForKeywordsInstruction: MarkForKeywordsInstruction[] = []

    constructor(
        folderPath: string,
        outDir: string, 
        fromDate: string, 
        toDate: string, 
        languages: string[], 
        creationDateCsvFilePath: string, 
        excludeRepoPaths: string[],
        markForKeywordsInstruction: MarkForKeywordsInstruction[]
    ) {
        this.folderPath = folderPath;
        this.outDir = outDir;
        this.fromDate = fromDate;
        this.toDate = toDate;
        this.languages = languages;
        this.creationDateCsvFilePath = creationDateCsvFilePath;
        this.excludeRepoPaths = excludeRepoPaths;
        this.markForKeywordsInstruction = markForKeywordsInstruction;
    }

    static fromJSON(json: any) {
        const instance = new ClocDiffBetweenDatesParams(
            json.folderPath,
            json.outDir,
            json.fromDate,
            json.toDate,
            json.languages,
            json.creationDateCsvFilePath,
            json.excludeRepoPaths,
            json.markForKeywordsInstruction
        );
        return instance;
    }

    static fromJSONFile(filePath: string) {
        // read the file using the fs module
        // const _filePath = path.resolve(__dirname, filePath);
        const json = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        return ClocDiffBetweenDatesParams.fromJSON(json);
    }
}
