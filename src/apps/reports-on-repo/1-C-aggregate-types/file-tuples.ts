import { FilesInfoDictionary } from '../1-C-aggregate-in-memory/repo-coupling-aggregate';

export type FileTuplesDict = {
    [fileTupleId: string]: {
        // how many times we find this file tuple in the selected timewindows
        tupleOccurrenciesInTimeWindow: number;
        files: FilesInfoDictionary;
    };
};
