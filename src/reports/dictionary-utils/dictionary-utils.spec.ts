import { expect } from 'chai';
import { keysInAll, smallestDictionary, allTuples, TUPLE_KEY_SEPARATOR } from './dictionary-utils';

describe(`utilities for dictionaries`, () => {
    describe(`smallestDictionary`, () => {
        const dict_1: { [k: string]: number } = {
            a: 1,
            b: 2,
        };
        const dict_2: { [k: string]: number } = {
            a: 1,
            b: 2,
            c: 3,
        };
        const dict_3: { [k: string]: number } = {
            c: 3,
            d: 4,
        };
        it(`returns the smallest dictionary, which is the first one in the collection`, () => {
            expect(smallestDictionary([dict_1, dict_2])).equal(dict_1);
        });
        it(`returns the smallest dictionary, which is the SECOND one in the collection`, () => {
            expect(smallestDictionary([dict_2, dict_1])).equal(dict_1);
        });
        it(`returns one of the 2 dictionaries which have size 1`, () => {
            const smallest = smallestDictionary([dict_1, dict_2, dict_3]);
            expect([dict_1, dict_3].includes(smallest)).true;
        });
    });
    describe(`keysInAll`, () => {
        const dict_1: { [k: string]: number } = {
            a: 11,
            b: 21,
        };
        const dict_2: { [k: string]: number } = {
            a: 12,
            b: 22,
            c: 32,
        };
        const dict_3: { [k: string]: number } = {
            c: 33,
            d: 4,
        };
        const dict_4: { [k: string]: number } = {
            c: 34,
            d: 4,
            e: 5,
        };
        it(`returns an empty array since there are no keys present in all dictionaries`, () => {
            const elementsInAll = keysInAll([dict_1, dict_2, dict_3]);
            expect(elementsInAll.length).equal(0);
        });
        it(`returns an array with 1 element since there is 1 key present in all dictionaries`, () => {
            const elementsInAll = keysInAll([dict_2, dict_3, dict_4]);
            expect(elementsInAll.length).equal(1);
            expect(elementsInAll[0].key).equal('c');
            expect(elementsInAll[0].entries.length).equal(3);
            expect(elementsInAll[0].entries.find((e) => e === 32)).equal(32);
            expect(elementsInAll[0].entries.find((e) => e === 33)).equal(33);
            expect(elementsInAll[0].entries.find((e) => e === 34)).equal(34);
        });
        it(`returns an array with 2 elements since there are 2 keys present in all dictionaries`, () => {
            const elementsInAll = keysInAll([dict_1, dict_2]);
            expect(elementsInAll.length).equal(2);
            expect(elementsInAll.find((d) => d.key === 'a').key).equal('a');
            expect(elementsInAll.find((d) => d.key === 'b').key).equal('b');
            expect(elementsInAll[0].entries.length).equal(2);
            expect(elementsInAll[0].entries.find((e) => e === 11)).equal(11);
            expect(elementsInAll[0].entries.find((e) => e === 12)).equal(12);
            expect(elementsInAll[1].entries.find((e) => e === 21)).equal(21);
            expect(elementsInAll[1].entries.find((e) => e === 22)).equal(22);
        });
    });
    describe(`allTuples`, () => {
        // first dictionary
        const dict_1_key_1 = 'a';
        const dict_1_val_1 = 11;
        const dict_1: { [k: string]: number } = {
            b: 21,
        };
        dict_1[dict_1_key_1] = dict_1_val_1;
        //
        // second dictionary
        const dict_2_key_2 = 'b';
        const dict_2_val_2 = 22;
        const dict_2: { [k: string]: number } = {
            a: 12,
            c: 32,
        };
        dict_2[dict_2_key_2] = dict_2_val_2;
        //
        // third dictionary
        const dict_3_key_2 = 'd';
        const dict_3_val_2 = 4;
        const dict_3: { [k: string]: number } = {
            c: 33,
        };
        dict_3[dict_3_key_2] = dict_3_val_2;
        it(`returns 12 tuples since the 3 ditionaries have 2, 3 and 2 elements respectively and the number of tuples is
        2 * 3 * 2 = 12`, () => {
            const tuplesDict = allTuples([dict_1, dict_2, dict_3]);
            const tuples = Object.values(tuplesDict);
            expect(tuples.length).equal(12);
            // 6 tuples contain the first value of the first dictionary
            const tuplesWithOneValue = tuples.filter((t) => t.includes(dict_1_val_1));
            expect(tuplesWithOneValue.length).equal(6);
            // 2 tuples contain the first value of the first dictionary and the second value of the second dictionary
            const tuplesWithTwoValues = tuples.filter((t) => t.includes(dict_1_val_1) && t.includes(dict_2_val_2));
            expect(tuplesWithTwoValues.length).equal(2);
            // 1 tuples contain the first value of the first dictionary and the second value of the second dictionary and the second of the third dictionary
            const tuplesWithThreeValues = tuples.filter(
                (t) => t.includes(dict_1_val_1) && t.includes(dict_2_val_2) && t.includes(dict_3_val_2),
            );
            expect(tuplesWithThreeValues.length).equal(1);
            // one of the keys of the dictionary is made of the concatenation of thre keys coming from the original dictionaries
            const expectedKey = `${dict_1_key_1}${TUPLE_KEY_SEPARATOR}${dict_2_key_2}${TUPLE_KEY_SEPARATOR}${dict_3_key_2}`;
            const tupleKeys = Object.keys(tuplesDict);
            expect(tupleKeys.includes(expectedKey)).true;
        });
    });
});
