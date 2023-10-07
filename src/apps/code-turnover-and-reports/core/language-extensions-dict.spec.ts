import { expect } from "chai";
import { languageExtensions } from "./language-extensions-dict";
import path from "path";

describe('languageExtensions', () => {
    it('should return the extensions defined in the default dictionary if no file is passed in', () => {
        const languages = ['Java', 'SQL']
        const _languageExtensions = languageExtensions(languages)
        expect(_languageExtensions.length).equal(2)
        expect(_languageExtensions.includes('*.java')).to.be.true
        expect(_languageExtensions.includes('*.sql')).to.be.true
    });
    it('should return the extensions defined in the json dictionary specified by the file passed in', () => {
        const langExtensionsFile = path.join(process.cwd(), 'test-data', 'lang-extensions-dict', 'lang-extentions-dict.json')
        const languages = ['Java', 'SQL']
        const _languageExtensions = languageExtensions(languages, langExtensionsFile)
        expect(_languageExtensions.length).equal(1)
    });
});