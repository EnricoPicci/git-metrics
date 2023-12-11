# fetch-repos

[launchFetchRepos()](./launch-fetch-repos.ts) is a utility command that fetches all git repos which are contained in a **folder** and in all its subfolders.

## parameters
- --folderPath: folder containing the repos to fetch (e.g. ./repos)

## example
`node ./dist/lib/command.js fetch-repos --folderPath ./temp`