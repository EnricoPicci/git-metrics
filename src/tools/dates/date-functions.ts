/**
 * Converts a Date object to a string in the format 'YYYY-MM-DD'.
 * @param date The Date object to convert.
 * @returns A string representing the date in the format 'YYYY-MM-DD'.
 */
export function toYYYYMMDD(date: Date) {
    return date.toISOString().split('T')[0];
}

export function addDays(date: Date, days: number) {
    const _date = new Date(date);
    _date.setUTCDate(_date.getDate() + days);
    return _date;
}

export function diffInDays(date_1: Date, date_2: Date) {
    const diffTime = date_1.getTime() - date_2.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function dayToWeekDictionary(start: Date, end: Date) {
    const _dayToWeekDictionary: { [day: string]: string } = {};
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
