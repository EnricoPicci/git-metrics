// ClocLanguageStats is an interface that represents the statistics about a language
// produced by the cloc tool
// #copilot - the following interface was generated by copilot
export interface ClocLanguageStats extends ClocStats {
    language: string;
}

export interface ClocStats {
    nFiles?: number;  // optional because we may want to delete it to reduce the size of the final output
    blank?: number;  // optional because we may want to delete it to reduce the size of the final output
    comment?: number;  // optional because we may want to delete it to reduce the size of the final output
    code: number;
}

export interface ClocFileInfo {
    language: string;
    file: string;
    blank: number;
    comment: number;
    code: number
};

export type ClocDictionary = { [path: string]: ClocFileInfo };