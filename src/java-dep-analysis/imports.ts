import path from "path";

import { Observable, concatMap, defaultIfEmpty, filter, from, ignoreElements, map, merge, mergeMap, reduce, share, tap } from "rxjs";

import { appendFileObs, readLineObs } from "observable-fs";

import { allJavaFiles } from "./java-files";
import { PackageMemberErrors, PackageMemberDict, allJavaPackageMembersDict$, javaPackage$ } from "./packages";
import { toCsvObs } from "@enrico.piccinin/csv-tools";
import { deleteFile$ } from "../tools/observable-fs-extensions/delete-file-ignore-if-missing";

/**
 * Fetches all imported packages for all Java files from a directory and its subdirectories and returns an Observable 
 * that emits an object containing each imported package name along with the repository path, directory name, Java file path, 
 * and the name of the package to which the Java file belongs (the importing package).
 * @param fromDirPath The path to the directory to fetch the Java files from.
 * @param excludeRepoPaths An optional array of repository paths to exclude.
 * @returns An Observable that emits an object containing each imported package name along with the repository path, 
 * directory name, Java file path, and the name of the package to which the Java file belongs (the importing package).
 * @throws An error if an imported package member does not contain a dot.
 */
export function allImportsForFiles$(fromDirPath: string, excludeRepoPaths?: string[]) {
    const errors: any[] = []
    return allJavaFiles(fromDirPath, excludeRepoPaths).pipe(
        concatMap(({ javaFile, repoPath }) => {
            const importingRepo = repoPath.split(fromDirPath)[1]
            const importingFile = javaFile.split(fromDirPath)[1]
            const importingRepoArea = path.dirname(importingRepo).split(fromDirPath)[1]
            return javaPackage$(javaFile, errors).pipe(
                map((importingPackage) => ({ importingRepoArea, importingRepo, importingPackage, importingFile, repoPath, javaFile }))
            )
        }),
        concatMap(({ importingPackage, importingRepo, importingFile, javaFile, repoPath }) => {
            const dirPath = path.dirname(javaFile)
            const dirName = dirPath.slice(repoPath.length + 1)
            // read the java file, filter the lines that start with "import " or "import static " 
            // and return a stream of objects containing the repository path, directory name, java file path
            // the name of the package to which the java file belongs (the importing package) and imported package name
            return readLineObs(javaFile).pipe(
                filter((line) => {
                    const trimmedLine = line.trim()
                    return trimmedLine.startsWith('import ') ||
                        trimmedLine.startsWith('import static ')
                }),
                map((line) => {
                    const importedPackageMember = line.slice(7, -1).trim();
                    if (importedPackageMember.length === 0) {
                        throw new Error(`Import statement in file "${javaFile}" is empty`)
                    }
                    return importedPackageMember
                }),
                // reduce all the imported packages to a set
                reduce((set, importedPackageMember) => {
                    set.add(importedPackageMember)
                    return set
                }, new Set<string>()),
                // convert the set to an array
                map((set) => Array.from(set).map((importedPackageMember) => (
                    { repoPath, dirName, javaFile, importingRepo, importingPackage, importingFile, importedPackageMember }
                ))),
                // flatten the array of objects 
                mergeMap((importObjs) => importObjs),
            )
        }),
    )
}

export function allImportsForFilesWithRepoInfo$(
    packagMembersDict$: Observable<{
        packageMemberDict: PackageMemberDict;
        packageMemberErrors: PackageMemberErrors;
    }>,
    imports$: Observable<{
        repoPath: string;
        dirName: string;
        javaFile: string;
        importingRepo: string;
        importingPackage: string | Error;
        importingFile: string;
        importedPackageMember: string;
    }>,
) {

    return packagMembersDict$.pipe(
        concatMap(({ packageMemberDict }) => {
            return imports$.pipe(
                map((importObj) => {
                    let importedRepo = '-'
                    let importedJavaFile = '-'
                    let importedRepoArea = '-'
                    const importedPackageInfo = packageMemberDict[importObj.importedPackageMember]
                    if (importedPackageInfo) {
                        importedRepo = importedPackageInfo.repoPath
                        importedJavaFile = importedPackageInfo.javaFile
                        importedRepoArea = importedPackageInfo.repoArea
                    }
                    return { ...importObj, importedRepoArea, importedRepo, importedJavaFile }
                })
            )
        })
    )
}

export function writeAllImportsForFilesWithRepoInfo$(
    dirForFiles: string,
    dirForPackages: string,
    outdir: string,
    excludeRepoPaths?: string[]
) {
    // packageMembersDict is shared since it used by two observables: the one that writes the csv file and the one that writes the errors file
    // sharing ensures that the read operations on the files performed by allJavaPackageMembersDict$ are performed only once
    const packageMembersDict$ = allJavaPackageMembersDict$(dirForPackages, excludeRepoPaths).pipe(share())
    const imports$ = allImportsForFiles$(dirForFiles, excludeRepoPaths)

    const dirForFilesName = path.basename(dirForFiles)

    const outFilePath = path.join(outdir, `${dirForFilesName}-all-imports.csv`)
    const writeImportCsv$ = deleteFile$(outFilePath).pipe(
        concatMap(() => allImportsForFilesWithRepoInfo$(packageMembersDict$, imports$)),
        toCsvObs(),
        concatMap((line) => {
            return appendFileObs(outFilePath, `${line}\n`);
        }),
        ignoreElements(),
        defaultIfEmpty(outFilePath),
        tap({
            next: (outFilePath) => {
                console.log(`====>>>> all-imports info saved on file ${outFilePath}`);
            },
        }),
    )

    const errorsFilePath = path.join(outdir, `${dirForFilesName}-all-imports-errors.csv`)
    const writeErrors$ = deleteFile$(errorsFilePath).pipe(
        concatMap(() => packageMembersDict$),
        map(({ packageMemberErrors }) => packageMemberErrors),
        concatMap(errors => from(errors)),
        toCsvObs(),
        concatMap((line) => {
            return appendFileObs(errorsFilePath, `${line}\n`);
        }),
        ignoreElements(),
        defaultIfEmpty(errorsFilePath),
        tap({
            next: (errorsFilePath) => {
                console.log(`====>>>> all-imports errors saved on file ${errorsFilePath}`);
            },
        }),
    )

    return merge(writeImportCsv$, writeErrors$)
}