"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const from_csv_1 = require("./from-csv");
const config_1 = require("../../reports-on-repo/0-config/config");
describe(`fromCsv`, () => {
    it(`create an array of objects starting from an header and an array of lines`, () => {
        const sep = config_1.DEFAUL_CONFIG.CSV_SEP;
        const header = `col_1${sep} col_2${sep} col_3`;
        const lines = [`1${sep}2${sep}3`, `a${sep}b${sep}c`];
        const objsFromCsv = (0, from_csv_1.fromCsv)(header, lines);
        (0, chai_1.expect)(objsFromCsv.length).equal(lines.length);
        const firstObj = objsFromCsv[0];
        (0, chai_1.expect)(firstObj.col_1).equal('1');
        (0, chai_1.expect)(firstObj.col_2).equal('2');
        (0, chai_1.expect)(firstObj.col_3).equal('3');
        const lastObj = objsFromCsv[lines.length - 1];
        (0, chai_1.expect)(lastObj.col_2).equal('b');
        (0, chai_1.expect)(lastObj.col_3).equal('c');
    });
});
//# sourceMappingURL=from-csv.spec.js.map