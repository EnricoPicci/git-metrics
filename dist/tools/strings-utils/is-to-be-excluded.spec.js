"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const is_to_be_excluded_1 = require("./is-to-be-excluded");
describe('isToBeExcluded', () => {
    describe('isToBeExcluded', () => {
        it('should return true if the string to test is in the excludeStrings array', () => {
            const stringToTest = 'my-string';
            const excludeStrings = ['my-string', 'other-string'];
            const result = (0, is_to_be_excluded_1.isToBeExcluded)(stringToTest, excludeStrings);
            (0, chai_1.expect)(result).to.be.true;
        });
        it('should return true if the string to test matches a wildcard pattern in the excludeStrings array', () => {
            const stringToTest = 'my-string-123';
            const excludeStrings = ['my-string-*', 'other-string'];
            const result = (0, is_to_be_excluded_1.isToBeExcluded)(stringToTest, excludeStrings);
            (0, chai_1.expect)(result).to.be.true;
        });
        it('should return true if the string to test matches a wildcard pattern in the excludeStrings array', () => {
            const stringToTest = 'one-string-123';
            const excludeStrings = ['my-string-*', 'other-string'];
            const result = (0, is_to_be_excluded_1.isToBeExcluded)(stringToTest, excludeStrings);
            (0, chai_1.expect)(result).to.be.false;
        });
        it('should return false if the string to test is not in the excludeStrings array', () => {
            const stringToTest = 'my-string';
            const excludeStrings = ['other-string'];
            const result = (0, is_to_be_excluded_1.isToBeExcluded)(stringToTest, excludeStrings);
            (0, chai_1.expect)(result).to.be.false;
        });
        it('should return false if the string to test does not match any wildcard pattern in the excludeStrings array', () => {
            const stringToTest = 'my-string-123';
            const excludeStrings = ['other-string-*'];
            const result = (0, is_to_be_excluded_1.isToBeExcluded)(stringToTest, excludeStrings);
            (0, chai_1.expect)(result).to.be.false;
        });
        it('should return false if the excludeStrings array is empty', () => {
            const stringToTest = 'my-string';
            const excludeStrings = [];
            const result = (0, is_to_be_excluded_1.isToBeExcluded)(stringToTest, excludeStrings);
            (0, chai_1.expect)(result).to.be.false;
        });
        it('should return true if the stringToTest is a real path and the excludeStrings array contains a part of it', () => {
            const stringToTest = '../../temp/iiab/SharedACN';
            const excludeStrings = ['*dbm', 'dbobjects*', '*passptfdanni', '*sharedacn'];
            const result = (0, is_to_be_excluded_1.isToBeExcluded)(stringToTest, excludeStrings);
            (0, chai_1.expect)(result).to.be.true;
        });
        it('should return false if the stringToTest is a real path and the excludeStrings array does not contain a part of it', () => {
            const stringToTest = '../../temp/iiab/SharedACN';
            const excludeStrings = ['*dbm', '*dbobjects*', '*passptfdanni'];
            const result = (0, is_to_be_excluded_1.isToBeExcluded)(stringToTest, excludeStrings);
            (0, chai_1.expect)(result).to.be.false;
        });
        it('should return true if the stringToTest is a real path and the excludeStrings array contains a part of it', () => {
            const stringToTest = '../../temp/vita/dbobjects-passvita';
            const excludeStrings = ['*dbm', '*dbobjects*', '*passptfdanni'];
            const result = (0, is_to_be_excluded_1.isToBeExcluded)(stringToTest, excludeStrings);
            (0, chai_1.expect)(result).to.be.true;
        });
        it(`should return false if the stringToTest is a value and the excludeStrings array contains a pattern in the form of 
        *x*' but the stringToTest does not contain any x`, () => {
            const stringToTest = '../../temp/iiab/temporary_forks/passptfdanni';
            const excludeStrings = ['*db*'];
            const result = (0, is_to_be_excluded_1.isToBeExcluded)(stringToTest, excludeStrings);
            (0, chai_1.expect)(result).to.be.false;
        });
    });
});
//# sourceMappingURL=is-to-be-excluded.spec.js.map