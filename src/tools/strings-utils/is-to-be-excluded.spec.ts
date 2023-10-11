import { expect } from "chai"
import { isToBeExcluded } from "./is-to-be-excluded"


describe('isToBeExcluded', () => {
    describe('isToBeExcluded', () => {
        it('should return true if the string to test is in the excludeStrings array', () => {
            const stringToTest = 'my-string'
            const excludeStrings = ['my-string', 'other-string']
            const result = isToBeExcluded(stringToTest, excludeStrings)
            expect(result).to.be.true
        })

        it('should return true if the string to test matches a wildcard pattern in the excludeStrings array', () => {
            const stringToTest = 'my-string-123'
            const excludeStrings = ['my-string-*', 'other-string']
            const result = isToBeExcluded(stringToTest, excludeStrings)
            expect(result).to.be.true
        })

        it('should return true if the string to test matches a wildcard pattern in the excludeStrings array', () => {
            const stringToTest = 'one-string-123'
            const excludeStrings = ['my-string-*', 'other-string']
            const result = isToBeExcluded(stringToTest, excludeStrings)
            expect(result).to.be.false
        })

        it('should return false if the string to test is not in the excludeStrings array', () => {
            const stringToTest = 'my-string'
            const excludeStrings = ['other-string']
            const result = isToBeExcluded(stringToTest, excludeStrings)
            expect(result).to.be.false
        })

        it('should return false if the string to test does not match any wildcard pattern in the excludeStrings array', () => {
            const stringToTest = 'my-string-123'
            const excludeStrings = ['other-string-*']
            const result = isToBeExcluded(stringToTest, excludeStrings)
            expect(result).to.be.false
        })

        it('should return false if the excludeStrings array is empty', () => {
            const stringToTest = 'my-string'
            const excludeStrings: string[] = []
            const result = isToBeExcluded(stringToTest, excludeStrings)
            expect(result).to.be.false
        })

        it('should return true if the stringToTest is a real path and the excludeStrings array contains a part of it', () => {
            const stringToTest = '../../temp/iiab/SharedACN'
            const excludeStrings = ['*dbm', 'dbobjects*', '*passptfdanni', '*sharedacn']
            const result = isToBeExcluded(stringToTest, excludeStrings)
            expect(result).to.be.true
        })

        it('should return false if the stringToTest is a real path and the excludeStrings array does not contain a part of it', () => {
            const stringToTest = '../../temp/iiab/SharedACN'
            const excludeStrings = ['*dbm', '*dbobjects*', '*passptfdanni']
            const result = isToBeExcluded(stringToTest, excludeStrings)
            expect(result).to.be.false
        })

        it('should return true if the stringToTest is a real path and the excludeStrings array contains a part of it', () => {
            const stringToTest = '../../temp/vita/dbobjects-passvita'
            const excludeStrings = ['*dbm', '*dbobjects*', '*passptfdanni']
            const result = isToBeExcluded(stringToTest, excludeStrings)
            expect(result).to.be.true
        })

        it(`should return false if the stringToTest is a value and the excludeStrings array contains a pattern in the form of 
        *x*' but the stringToTest does not contain any x`, () => {
            const stringToTest = '../../temp/iiab/temporary_forks/passptfdanni'
            const excludeStrings = ['*db*']
            const result = isToBeExcluded(stringToTest, excludeStrings)
            expect(result).to.be.false
        })

    })
})