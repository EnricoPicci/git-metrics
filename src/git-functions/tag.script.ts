import { concatMap, filter, from, map, mergeMap, toArray } from "rxjs"
import { readTag$ } from "./tag"
import { toCsvObs } from "@enrico.piccinin/csv-tools"
import { writeFileObs } from "observable-fs"
import path from "path"
import { gitRepoPaths } from "./repo-path"

const reposFolder = '../../temp/pass'
const fromDate = new Date('2023-01-01')
const outDir = './out'
const outFile = 'tags-2023.csv'

const outFilePath = path.join(outDir, outFile)

from(gitRepoPaths(reposFolder)).pipe(
    mergeMap(repo => {
        return readTag$({ repoFolderPath: repo })
    }),
    filter(tag => new Date(tag.date) > fromDate),
    map(tag => {
        const tagName = tag.tagName
        // extract the release number from the tag name
        const releaseNumber = tagName.match(/\d+\.\d+\.\d+/)?.[0] ?? '-'
        // the area is the first directory name in the repo path after the reposFolder
        const _reposFolder = reposFolder.endsWith(path.sep) ? reposFolder : reposFolder + path.sep
        const repoPathParts = tag.repoPath.split(_reposFolder)
        const repoPathAfterReposFolder = repoPathParts[1]
        const area = repoPathAfterReposFolder.split(path.sep)[0]
        const repo = repoPathAfterReposFolder.slice(area.length + 1)
        return { ...tag, releaseNumber, area, repo }
    }),
    toCsvObs(),
    toArray(),
    concatMap(records => {
        return writeFileObs(outFilePath, records)
    })
).subscribe({
    complete: () => {
        console.log(`Tags written to ${outFilePath}`)
    }
})
