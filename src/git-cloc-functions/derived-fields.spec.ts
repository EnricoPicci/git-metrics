import { expect } from "chai";
import { calcArea } from "./derived-fields";
import path from "path";


describe(`calcArea`, () => {
    it(`calculate the area given a repo path and a reposFolderPath`, () => {
        const reposFolderPath = path.join('..', '..', 'temp', 'my_repos_folder')
        const repoPath = path.join('..', '..', 'temp', 'my_repos_folder', 'my_area', 'my_repo');

        const expectedArea = 'my_area'

        const area = calcArea(repoPath, reposFolderPath);
        expect(area).to.equal(expectedArea);
    }).timeout();

    it(`calculate the area given a repo path and a , with the reposFolderPath ending with a sep`, () => {
        const reposFolderPath = path.join('..', '..', 'temp', 'my_repos_folder') + path.sep
        const repoPath = path.join('..', '..', 'temp', 'my_repos_folder', 'my_area', 'my_repo');

        const expectedArea = 'my_area'

        const area = calcArea(repoPath, reposFolderPath);
        expect(area).to.equal(expectedArea);
    }).timeout();

    it(`calculate the area if the reposFolderPath is .sep (e.g. ./)`, () => {
        const reposFolderPath = path.join('.', path.sep)
        const repoPath = `.${path.sep}${path.join('my_area', 'my_repo')}`;

        const expectedArea = 'my_area'

        const area = calcArea(repoPath, reposFolderPath);
        expect(area).to.equal(expectedArea);
    }).timeout();

    it(`calculate the area if the reposFolderPath is sep (e.g. /)`, () => {
        const reposFolderPath = path.sep
        const repoPath = `.${path.sep}${path.join('my_area', 'my_repo')}`;

        const expectedArea = 'my_area'

        const area = calcArea(repoPath, reposFolderPath);
        expect(area).to.equal(expectedArea);
    }).timeout();

    it(`calculate the area if the reposFolderPath is empty`, () => {
        const reposFolderPath = ''
        const repoPath = `.${path.sep}${path.join('my_area', 'my_repo')}`;

        const expectedArea = 'my_area'

        const area = calcArea(repoPath, reposFolderPath);
        expect(area).to.equal(expectedArea);
    }).timeout();

    it(`calculate the area if the reposFolderPath is empty and repoPath does not start with .sep (e.g. ./)`, () => {
        const reposFolderPath = ''
        const repoPath = 'my_area/my_repo';

        const expectedArea = 'my_area'

        const area = calcArea(repoPath, reposFolderPath);
        expect(area).to.equal(expectedArea);
    }).timeout();

    it(`calculate the area if the reposFolderPath is empty and repoPath starts with sep`, () => {
        const reposFolderPath = ''
        const repoPath = `${path.sep}${path.join('my_area', 'my_repo')}`;

        const expectedArea = 'my_area'

        const area = calcArea(repoPath, reposFolderPath);
        expect(area).to.equal(expectedArea);
    }).timeout();

    it(`errors if the reposFolderPath is not the first part of repoPath`, () => {
        const reposFolderPath = path.join('..', '..', 'temp', 'my_repos_folder')
        const repoPath = path.join('..', '..', 'somethingElseThanTemp', 'my_repos_folder', 'my_area', 'my_repo');

        expect(() => calcArea(repoPath, reposFolderPath)).to.throw();
    }).timeout();

    it(`calculate the area when repo path and reposFolderPath are the same`, () => {
        const repoPath = path.join('..', '..', 'temp', 'my_repos_folder', 'my_repo');
        const reposFolderPath = repoPath

        const expectedArea = ''

        const area = calcArea(repoPath, reposFolderPath);
        expect(area).to.equal(expectedArea);
    }).timeout();
});