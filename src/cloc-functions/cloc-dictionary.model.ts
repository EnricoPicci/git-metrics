
export type ClocInfo = { language: string; filename: string; blank: number; comment: number; code: number; };

export type ClocDictionary = { [path: string]: ClocInfo; };
