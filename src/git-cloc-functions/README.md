# git-cloc-functions
This library contains a set of functions that mix `git` and `cloc` commands to generate enriched data about the changes that occurred in a repo or set of repos in a certain timeframe. 

Via the `cloc --git-diff-rel` command we get info about the files that have changed from one commit to the next in terms of lines of code/comment/blank added/removed/modified. Via `git` commands we complement such info with further data, e.g. whether a change is a copy/remove.

For instance it is possible to calculate which files have been changed looking at all the commits of a repo in a certain time window, where the changes occurred (i.e. code lines, blank lines or comment lines), whether the changes are additions, deletions or modifications.

If a certain file is still present in the folder (i.e. has not been deleted in the time window considered), the data are also enriched by the information about how many lines of code/comment/blank are currently present in the file.

Other enrichments are the url of the repo (if there is a remote url) and the date of the parent commit (so that we can calculate the period spanned by the commit).

# code-tunover
The functions of this library calculate the **code-turnover**, i.e. the total amount of lines of code changed, added or modified in a certain period.

**code-turnover** can be considered a proxy of the work performed on a certain code base in a certain period.

# core of the module
The core of the module is in the [cloc-diff-commit](./cloc-diff-commit.ts) file.