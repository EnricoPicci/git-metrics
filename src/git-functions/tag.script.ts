import { concatMap, filter, from, mergeMap, toArray } from "rxjs"
import { readTag$ } from "./tag"
import { toCsvObs } from "@enrico.piccinin/csv-tools"
import { writeFileObs } from "observable-fs"
import path from "path"
import { gitRepoPaths } from "./repo-path"

const reposFolder = '../../temp/pass'
const fromDate = new Date('2022-01-01')
const outDir = './out'
const outFile = 'tags.csv'

const outFilePath = path.join(outDir, outFile)

from(gitRepoPaths(reposFolder)).pipe(
    mergeMap(repo => {
        return readTag$({ repoFolderPath: repo })
    }),
    filter(tag => new Date(tag.date) > fromDate),
    toCsvObs(),
    toArray(),
    concatMap(records => {
        return writeFileObs(outFilePath, records)
    })
).subscribe()
