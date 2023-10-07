"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const language_extensions_dict_1 = require("./language-extensions-dict");
const path_1 = __importDefault(require("path"));
describe('languageExtensions', () => {
    it('should return the extensions defined in the default dictionary if no file is passed in', () => {
        const languages = ['Java', 'SQL'];
        const _languageExtensions = (0, language_extensions_dict_1.languageExtensions)(languages);
        (0, chai_1.expect)(_languageExtensions.length).equal(2);
        (0, chai_1.expect)(_languageExtensions.includes('*.java')).to.be.true;
        (0, chai_1.expect)(_languageExtensions.includes('*.sql')).to.be.true;
    });
    it('should return the extensions defined in the json dictionary specified by the file passed in', () => {
        const langExtensionsFile = path_1.default.join(process.cwd(), 'test-data', 'lang-extensions-dict', 'lang-extentions-dict.json');
        const languages = ['Java', 'SQL'];
        const _languageExtensions = (0, language_extensions_dict_1.languageExtensions)(languages, langExtensionsFile);
        (0, chai_1.expect)(_languageExtensions.length).equal(1);
    });
});
//# sourceMappingURL=language-extensions-dict.spec.js.map