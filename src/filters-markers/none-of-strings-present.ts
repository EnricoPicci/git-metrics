export function noneOfStringsPresent(stringsToCheck: string[], rec: {[key: string]: string}, fieldName: string): boolean {
    // Return true if none of the stringsToCheck appear in the field fieldName of the record rec
    const inputString = rec[fieldName];
    return !stringsToCheck.some(str => inputString.includes(str));
}