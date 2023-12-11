"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dayToWeekDictionary = exports.diffInDays = exports.addDays = exports.toYYYYMMDD = void 0;
/**
 * Converts a Date object to a string in the format 'YYYY-MM-DD'.
 * @param date The Date object to convert.
 * @returns A string representing the date in the format 'YYYY-MM-DD'.
 */
function toYYYYMMDD(date) {
    return date.toISOString().split('T')[0];
}
exports.toYYYYMMDD = toYYYYMMDD;
function addDays(date, days) {
    const _date = new Date(date);
    _date.setUTCDate(_date.getDate() + days);
    return _date;
}
exports.addDays = addDays;
function diffInDays(date_1, date_2) {
    const diffTime = date_1.getTime() - date_2.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
exports.diffInDays = diffInDays;
function dayToWeekDictionary(start, end) {
    const _dayToWeekDictionary = {};
    const diffDays = diffInDays(end, start);
    let weekDaysCounter = 0;
    let currentWeekStart = start;
    for (let i = 0; i <= diffDays; i++) {
        const currentDay = toYYYYMMDD(addDays(start, i));
        _dayToWeekDictionary[currentDay] = toYYYYMMDD(currentWeekStart);
        weekDaysCounter++;
        if (weekDaysCounter === 7) {
            weekDaysCounter = 0;
            currentWeekStart = addDays(currentWeekStart, 7);
        }
    }
    return _dayToWeekDictionary;
}
exports.dayToWeekDictionary = dayToWeekDictionary;
//# sourceMappingURL=date-functions.js.map