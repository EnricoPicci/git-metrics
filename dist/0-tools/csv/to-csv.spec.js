"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const to_csv_1 = require("./to-csv");
const config_1 = require("../../reports-on-repo/0-config/config");
describe(`toCsv`, () => {
    it(`create, from an array of objects, an array of lines, the first one being the header the other being the rows in comma separated value (csv) format`, () => {
        const obj_1 = { col_1: '1', col_2: '2', col_3: '3' };
        const obj_2 = { col_1: 'a', col_2: 'b', col_3: 'c' };
        const objs = [obj_1, obj_2];
        const sep = config_1.DEFAUL_CONFIG.CSV_SEP;
        const header = `col_1${sep}col_2${sep}col_3`;
        const row_1 = `1${sep}2${sep}3`;
        const row_2 = `a${sep}b${sep}c`;
        const linesFromObjects = (0, to_csv_1.toCsv)(objs);
        // there are as many lines as objects in the array passed to the toCsv function plus 1 for the header
        (0, chai_1.expect)(linesFromObjects.length).equal(objs.length + 1);
        // the first line is the header
        (0, chai_1.expect)(linesFromObjects[0]).equal(header);
        // the other lines are the representations of the objects in csv format
        (0, chai_1.expect)(linesFromObjects[1]).equal(row_1);
        (0, chai_1.expect)(linesFromObjects[2]).equal(row_2);
    });
});
describe(`toCsvObs`, () => {
    it(`transform a stream of objectsinto a stream of lines, the first one being the header the other being the rows in comma separated value (csv) format`, () => {
        const obj_1 = { col_1: '1', col_2: '2', col_3: '3' };
        const obj_2 = { col_1: 'a', col_2: 'b', col_3: 'c' };
        const objs = [obj_1, obj_2];
        const sep = config_1.DEFAUL_CONFIG.CSV_SEP;
        const header = `col_1${sep}col_2${sep}col_3`;
        const row_1 = `1${sep}2${sep}3`;
        const row_2 = `a${sep}b${sep}c`;
        (0, rxjs_1.from)(objs)
            .pipe((0, to_csv_1.toCsvObs)(), (0, operators_1.toArray)(), (0, operators_1.tap)({
            next: (linesFromObjects) => {
                // there are as many lines as objects in the array passed to the toCsv function plus 1 for the header
                (0, chai_1.expect)(linesFromObjects.length).equal(objs.length + 1);
                // the first line is the header
                (0, chai_1.expect)(linesFromObjects[0]).equal(header);
                // the other lines are the representations of the objects in csv format
                (0, chai_1.expect)(linesFromObjects[1]).equal(row_1);
                (0, chai_1.expect)(linesFromObjects[2]).equal(row_2);
            },
        }))
            .subscribe();
    });
});
//# sourceMappingURL=to-csv.spec.js.map