# fetch-repos

[launchFetchRepos()](./launch-fetch-repos.ts) is a utility command that fetches all git repos which are contained in a **folder** and in all its subfolders.

## parameters
- --folderPath: folder containing the repos to fetch (e.g. ./repos)
- --excludeRepoPaths: a space separated list of folder names to be excluded from the fetch action (e.g. --excludeRepoPaths "dbm" "dbobjects") -
        default is the empty list which means no repos are excluded
        wildcard * can be used to exclude all repos that contain a certain string (e.g. --excludeRepoPaths "*dbm" will exclude all repos that contain the string "dbm")

## example
`npx fetch-repos --folderPath ./temp --excludeRepoPaths "*dbm"`
`node ./dist/lib/command.js fetch-repos --folderPath ./temp --excludeRepoPaths "*dbm"`