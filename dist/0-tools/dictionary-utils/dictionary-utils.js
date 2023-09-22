"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.allTuples = exports.TUPLE_KEY_SEPARATOR = exports.keysInAll = exports.smallestDictionary = void 0;
//******************************* UTILITIES FUNCTIONS AROUND DICTIONARIES *******************************
//
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function smallestDictionary(dictionaries) {
    let minSize = Infinity;
    let smallest;
    dictionaries.forEach((d) => {
        const dictSize = Object.keys(d).length;
        if (dictSize < minSize) {
            minSize = dictSize;
            smallest = d;
        }
    });
    return smallest;
}
exports.smallestDictionary = smallestDictionary;
// return all the entries (key value pairs) which corresponds to keys present in all the dictionaries passed in as parameters
function keysInAll(dictionaries) {
    const smallestDict = smallestDictionary(dictionaries);
    const smallestIndex = dictionaries.indexOf(smallestDict);
    const theOtherDicts = [...dictionaries];
    theOtherDicts.splice(smallestIndex, 1);
    const entriesInAllDictionaries = [];
    Object.entries(smallestDict).forEach(([key, value]) => {
        let isInAllDict = true;
        const entries = [];
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
exports.keysInAll = keysInAll;
// return all the tuples which can be created out of the values stored in the dictionaries
// the tuples are returned as a dictionary with the key composed concatenating the original key of the single element in the tuple
// So if we have 2 dictionaries like these
// dict_1 = {'a': 11}
// dict_1 = {'a': 21, 'b': 22}
// the result will be 2 tuples like these
// {'a_a': [11, 21] , 'a_b': [11, 22]}
exports.TUPLE_KEY_SEPARATOR = '._.';
function allTuples(dictionaries) {
    const _acc = {};
    return dictionaries.reduce((acc, dict) => {
        if (Object.keys(acc).length === 0) {
            const _firstAcc = Object.entries(dict).reduce((acc, [k, v]) => {
                acc[k] = [v];
                return acc;
            }, _acc);
            return _firstAcc;
        }
        const _dictEntries = Object.entries(dict);
        const _runningAcc = {};
        _dictEntries.forEach(([dictK, dictV]) => {
            Object.entries(acc).forEach(([k, tuple]) => {
                const newTuple = [...tuple];
                newTuple.push(dictV);
                const newKey = `${k}${exports.TUPLE_KEY_SEPARATOR}${dictK}`;
                _runningAcc[newKey] = newTuple;
            });
        });
        return _runningAcc;
    }, _acc);
}
exports.allTuples = allTuples;
//# sourceMappingURL=dictionary-utils.js.map