import { expect } from 'chai';
import { addDays, dayToWeekDictionary, diffInDays, toYYYYMMDD } from './date-functions';

describe(`toYYYYMMDD`, () => {
    it(`convert a date into YYYY-MM-DD format`, () => {
        const dateAsString = '2020-10-11';
        const date = new Date(dateAsString);
        const dateYYYYMMDD = toYYYYMMDD(date);

        expect(dateYYYYMMDD).equal(dateAsString);
    });
});

describe(`addDays`, () => {
    it(`adds a number of days to a date`, () => {
        const dateAsString = '2020-10-11';
        const date = new Date(dateAsString);
        const newDate = addDays(date, 7);
        const newDateAsString = toYYYYMMDD(newDate);
        const expectedDate = '2020-10-18';

        expect(newDateAsString).equal(expectedDate);
    });
    it(`adds a number of days to a date`, () => {
        const dateAsString = '2018-03-02';
        const date = new Date(dateAsString);
        const newDate_239 = addDays(date, 239);
        const newDate_240 = addDays(date, 240);
        const newDate_241 = addDays(date, 241);
        const newDateAsString_239 = toYYYYMMDD(newDate_239);
        const newDateAsString_240 = toYYYYMMDD(newDate_240);
        const newDateAsString_241 = toYYYYMMDD(newDate_241);
        const expectedDate_239 = '2018-10-27';
        const expectedDate_240 = '2018-10-28';
        const expectedDate_241 = '2018-10-29';

        expect(newDateAsString_239).equal(expectedDate_239);
        expect(newDateAsString_240).equal(expectedDate_240);
        expect(newDateAsString_241).equal(expectedDate_241);
    });
});

describe(`diffInDays`, () => {
    it(`calculates the difference in days between 2 dates`, () => {
        const dateAsString_1 = '2020-10-11';
        const date_1 = new Date(dateAsString_1);
        const dateAsString_2 = '2020-10-14';
        const date_2 = new Date(dateAsString_2);
        const diff = diffInDays(date_2, date_1);

        expect(diff).equal(3);
    });
});

describe(`dayToWeekDictionary`, () => {
    it(`creates a dictionary where each day is a key and the value is week it belongs`, () => {
        const startAsString = '2020-10-11';
        const start = new Date(startAsString);
        const endAsString = '2020-11-11';
        const end = new Date(endAsString);
        const dict = dayToWeekDictionary(start, end);

        expect(Object.keys(dict).length).equal(32);
        const values = Object.values(dict);
        const weeks = new Set(values);
        expect(weeks.size).equal(5);
    });
});

describe(`dayToWeekDictionary`, () => {
    it(`creates a dictionary where each day is a key and the value is week it belongs`, () => {
        const startAsString = '2018-03-02';
        const start = new Date(startAsString);
        // const endAsString = '2021-09-29';
        const endAsString = '2018-11-09';
        const end = new Date(endAsString);
        const dict = dayToWeekDictionary(start, end);

        const aDay = dict['2018-10-28'];
        expect(aDay).not.undefined;
    });
});

// 2018-03-02
// 2018-10-30
// 2021-09-28
// 2021-09-29
