"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isToBeExcluded = void 0;
/**
 * Determines whether a string should be excluded from a list of strings based on an array of excluded patterns.
 * The function returns a boolean indicating whether the string should be excluded.
 * @param stringToCheck The string to check for exclusion.
 * @param excludePatterns An array of patterns to exclude from the list of strings.
 * @returns A boolean indicating whether the string should be excluded.
 */
function isToBeExcluded(stringToCheck, excludePatterns) {
    const excludePatternLowerCase = excludePatterns.map((excludePattern) => excludePattern.toLowerCase());
    const stringLowerCase = stringToCheck.toLowerCase();
    const resp = excludePatternLowerCase.some((excludePattern) => {
        if (excludePattern.includes('*')) {
            const _excludePattern = excludePattern.replaceAll('*', '.*');
            const excludeRepoRegex = new RegExp(_excludePattern);
            return excludeRepoRegex.test(stringLowerCase);
        }
        else {
            return stringLowerCase === excludePattern;
        }
    });
    return resp;
}
exports.isToBeExcluded = isToBeExcluded;
//# sourceMappingURL=is-to-be-excluded.js.map