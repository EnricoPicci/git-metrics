import { expect } from 'chai';
import { fromCsv } from './from-csv';
import { CONFIG } from '../../config';

describe(`fromCsv`, () => {
    it(`create an array of objects starting from an header and an array of lines`, () => {
        const sep = CONFIG.CSV_SEP;
        const header = `col_1${sep} col_2${sep} col_3`;
        const lines = [`1${sep}2${sep}3`, `a${sep}b${sep}c`];

        type objType = { col_1: string; col_2: string; col_3: string };

        const objsFromCsv = fromCsv(header, lines) as objType[];

        expect(objsFromCsv.length).equal(lines.length);
        const firstObj = objsFromCsv[0];
        expect(firstObj.col_1).equal('1');
        expect(firstObj.col_2).equal('2');
        expect(firstObj.col_3).equal('3');
        const lastObj = objsFromCsv[lines.length - 1];
        expect(lastObj.col_2).equal('b');
        expect(lastObj.col_3).equal('c');
    });
});
