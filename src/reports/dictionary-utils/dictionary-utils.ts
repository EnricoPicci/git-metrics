//******************************* UTILITIES FUNCTIONS AROUND DICTIONARIES *******************************
//
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function smallestDictionary(dictionaries: any[]) {
    let minSize = Infinity;
    let smallest = undefined;
    dictionaries.forEach((d) => {
        const discSize = Object.keys(d).length;
        if (discSize < minSize) {
            minSize = discSize;
            smallest = d;
        }
    });
    return smallest;
}
// return all the entries (key value pairs) which corresponds to keys present in all the dictionaries passed in as parameters

export function keysInAll<V>(dictionaries: { [k: string]: V }[]) {
    const smallestDict: { [k: string]: V } = smallestDictionary(dictionaries);
    const smallestIndex = dictionaries.indexOf(smallestDict);
    const theOtherDicts = [...dictionaries];
    theOtherDicts.splice(smallestIndex, 1);
    const entriesInAllDictionaries: { key: string; entries: V[] }[] = [];
    Object.entries(smallestDict).forEach(([key, value]) => {
        let isInAllDict = true;
        const entries: V[] = [];
        for (let i = 0; i < theOtherDicts.length; i++) {
            const dict = theOtherDicts[i];
            const val = dict[key];
            if (!val) {
                isInAllDict = false;
                break;
            }
            entries.push(val);
        }
        if (isInAllDict) {
            entries.push(value);
            entriesInAllDictionaries.push({ key, entries });
        }
    });
    return entriesInAllDictionaries;
}
// return all the tuples which can be created out of the values stored in the dictionaries
// the tuples are returned as a dictionary with the key composed concatenating the original key of the single element in the tuple
// So if we have 2 dictionaries like these
// dict_1 = {'a': 11}
// dict_1 = {'a': 21, 'b': 22}
// the result will be 2 tuples like these
// {'a_a': [11, 21] , 'a_b': [11, 22]}

export const TUPLE_KEY_SEPARATOR = '._.';
export function allTuples<V>(dictionaries: { [k: string]: V }[]) {
    const _acc: { [key: string]: V[] } = {};
    return dictionaries.reduce((acc, dict) => {
        if (Object.keys(acc).length === 0) {
            const _firstAcc = Object.entries(dict).reduce((acc, [k, v]) => {
                acc[k] = [v];
                return acc;
            }, _acc);
            return _firstAcc;
        }
        const _dictEntries = Object.entries(dict);
        const _runningAcc: { [key: string]: V[] } = {};
        _dictEntries.forEach(([dictK, dictV]) => {
            Object.entries(acc).forEach(([k, tuple]) => {
                const newTuple = [...tuple];
                newTuple.push(dictV);
                const newKey = `${k}${TUPLE_KEY_SEPARATOR}${dictK}`;
                _runningAcc[newKey] = newTuple;
            });
        });
        return _runningAcc;
    }, _acc);
}
