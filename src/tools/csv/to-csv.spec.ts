import { expect } from 'chai';
import { from } from 'rxjs';
import { toArray, tap } from 'rxjs/operators';
import { toCsv, toCsvObs } from './to-csv';

describe(`toCsv`, () => {
    it(`create, from an array of objects, an array of lines, the first one being the header the other being the rows in comma separated value (csv) format`, () => {
        type objType = { col_1: string; col_2: string; col_3: string };
        const obj_1: objType = { col_1: '1', col_2: '2', col_3: '3' };
        const obj_2: objType = { col_1: 'a', col_2: 'b', col_3: 'c' };
        const objs = [obj_1, obj_2];

        const header = `col_1,col_2,col_3`;
        const row_1 = `1,2,3`;
        const row_2 = `a,b,c`;

        const linesFromObjects = toCsv(objs);

        // there are as many lines as objects in the array passed to the toCsv function plus 1 for the header
        expect(linesFromObjects.length).equal(objs.length + 1);
        // the first line is the header
        expect(linesFromObjects[0]).equal(header);
        // the other lines are the representations of the objects in csv format
        expect(linesFromObjects[1]).equal(row_1);
        expect(linesFromObjects[2]).equal(row_2);
    });
});

describe(`toCsvObs`, () => {
    it(`transform a stream of objectsinto a stream of lines, the first one being the header the other being the rows in comma separated value (csv) format`, () => {
        type objType = { col_1: string; col_2: string; col_3: string };
        const obj_1: objType = { col_1: '1', col_2: '2', col_3: '3' };
        const obj_2: objType = { col_1: 'a', col_2: 'b', col_3: 'c' };
        const objs = [obj_1, obj_2];

        const header = `col_1,col_2,col_3`;
        const row_1 = `1,2,3`;
        const row_2 = `a,b,c`;

        from(objs)
            .pipe(
                toCsvObs(),
                toArray(),
                tap({
                    next: (linesFromObjects) => {
                        // there are as many lines as objects in the array passed to the toCsv function plus 1 for the header
                        expect(linesFromObjects.length).equal(objs.length + 1);
                        // the first line is the header
                        expect(linesFromObjects[0]).equal(header);
                        // the other lines are the representations of the objects in csv format
                        expect(linesFromObjects[1]).equal(row_1);
                        expect(linesFromObjects[2]).equal(row_2);
                    },
                }),
            )
            .subscribe();
    });
});
