# git-functions
git-functions contains functions that wrap [git](https://git-scm.com/) commands and return their results in different formats.

## branches.ts
Provide functions to read branches data. It uses the [git log --graph](https://git-scm.com/docs/git-log) command.

## commit-url.ts
Provide a function to build the url of a commit in the remote repo.

## commit.ts
Provide functions that read the commit records from one local repo. Such commit records can be also written on csv output files. It uses the [git log](https://git-scm.com/docs/git-log) command.

## diff-file.ts
Provide functions that return the differences in the files between two commits. It uses the [git diff](https://git-scm.com/docs/git-diff) command.

## repo-path.ts
Provide functions to find paths to git repos.

## repo.ts
Provide functions to work with git repos, e.g. clone them or calculate the remote url of a repo.

## tag.ts
Provide functions that read the tags from one local repo. It uses the [git log](https://git-scm.com/docs/git-log) command.