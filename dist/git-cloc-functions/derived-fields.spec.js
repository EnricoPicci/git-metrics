"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const derived_fields_1 = require("./derived-fields");
const path_1 = __importDefault(require("path"));
describe(`calcArea`, () => {
    it(`calculate the area given a repo path and a reposFolderPath`, () => {
        const reposFolderPath = path_1.default.join('..', '..', 'temp', 'my_repos_folder');
        const repoPath = path_1.default.join('..', '..', 'temp', 'my_repos_folder', 'my_area', 'my_repo');
        const expectedArea = 'my_area';
        const area = (0, derived_fields_1.calcArea)(repoPath, reposFolderPath);
        (0, chai_1.expect)(area).to.equal(expectedArea);
    }).timeout();
    it(`calculate the area given a repo path and a , with the reposFolderPath ending with a sep`, () => {
        const reposFolderPath = path_1.default.join('..', '..', 'temp', 'my_repos_folder') + path_1.default.sep;
        const repoPath = path_1.default.join('..', '..', 'temp', 'my_repos_folder', 'my_area', 'my_repo');
        const expectedArea = 'my_area';
        const area = (0, derived_fields_1.calcArea)(repoPath, reposFolderPath);
        (0, chai_1.expect)(area).to.equal(expectedArea);
    }).timeout();
    it(`calculate the area if the reposFolderPath is .sep (e.g. ./)`, () => {
        const reposFolderPath = path_1.default.join('.', path_1.default.sep);
        const repoPath = `.${path_1.default.sep}${path_1.default.join('my_area', 'my_repo')}`;
        const expectedArea = 'my_area';
        const area = (0, derived_fields_1.calcArea)(repoPath, reposFolderPath);
        (0, chai_1.expect)(area).to.equal(expectedArea);
    }).timeout();
    it(`calculate the area if the reposFolderPath is sep (e.g. /)`, () => {
        const reposFolderPath = path_1.default.sep;
        const repoPath = `.${path_1.default.sep}${path_1.default.join('my_area', 'my_repo')}`;
        const expectedArea = 'my_area';
        const area = (0, derived_fields_1.calcArea)(repoPath, reposFolderPath);
        (0, chai_1.expect)(area).to.equal(expectedArea);
    }).timeout();
    it(`calculate the area if the reposFolderPath is empty`, () => {
        const reposFolderPath = '';
        const repoPath = `.${path_1.default.sep}${path_1.default.join('my_area', 'my_repo')}`;
        const expectedArea = 'my_area';
        const area = (0, derived_fields_1.calcArea)(repoPath, reposFolderPath);
        (0, chai_1.expect)(area).to.equal(expectedArea);
    }).timeout();
    it(`calculate the area if the reposFolderPath is empty and repoPath does not start with .sep (e.g. ./)`, () => {
        const reposFolderPath = '';
        const repoPath = 'my_area/my_repo';
        const expectedArea = 'my_area';
        const area = (0, derived_fields_1.calcArea)(repoPath, reposFolderPath);
        (0, chai_1.expect)(area).to.equal(expectedArea);
    }).timeout();
    it(`calculate the area if the reposFolderPath is empty and repoPath starts with sep`, () => {
        const reposFolderPath = '';
        const repoPath = `${path_1.default.sep}${path_1.default.join('my_area', 'my_repo')}`;
        const expectedArea = 'my_area';
        const area = (0, derived_fields_1.calcArea)(repoPath, reposFolderPath);
        (0, chai_1.expect)(area).to.equal(expectedArea);
    }).timeout();
    it(`errors if the reposFolderPath is not the first part of repoPath`, () => {
        const reposFolderPath = path_1.default.join('..', '..', 'temp', 'my_repos_folder');
        const repoPath = path_1.default.join('..', '..', 'somethingElseThanTemp', 'my_repos_folder', 'my_area', 'my_repo');
        (0, chai_1.expect)(() => (0, derived_fields_1.calcArea)(repoPath, reposFolderPath)).to.throw();
    }).timeout();
    it(`calculate the area when repo path and reposFolderPath are the same`, () => {
        const repoPath = path_1.default.join('..', '..', 'temp', 'my_repos_folder', 'my_repo');
        const reposFolderPath = repoPath;
        const expectedArea = '';
        const area = (0, derived_fields_1.calcArea)(repoPath, reposFolderPath);
        (0, chai_1.expect)(area).to.equal(expectedArea);
    }).timeout();
});
//# sourceMappingURL=derived-fields.spec.js.map