# git-metrics

**git-metrics** is set of libraries and apps to calculate different measures on git repos.

## run git-metrics apps

The apps can be launched with the command

`npx git-metrics <app-name> <params>`

or, if we have cloned git-metrics repo, from the git-metrics repo folder launching the command

`node ./dist/lib/command.js <app-name> <params>`

Executing `npx git-metrics` prints on the console the list of available apps.

Executing `npx git-metrics <app-name> -h` prints on the console the help for the specific app.

## apps available
- **code-turnover**: calculates the **code-turnover** on the repos contained in a folder and save it to csv files - **code-turnover** is a measure of the effort spent to develop and maintain a codebase in a certain time window
- **read-repos-commits**: reads all the commit records of a set of repos and save them on csv files - the result can be used to have an high level idea of how intense is the work on a certain codebase
- **cloc-byfile-multi-repos**: calculates the lines of code/comments/blanks on all the files in all the repos contained in a certain folder using the [cloc](https://github.com/AlDanial/cloc) command which, by default, works on a single repo
- **cloc-monthly-diff-repos**: calculates statistics about the changes that occurred on a codebase on a monthly basis, i.e. calculating the differences in the codebase between the last commit of a month and the last commit of the previous month
- **reports**: there are also different reports that can be run on repos to gather statistics about, for instance, the files that have changed most in a certain period of time, the authors that have contributed more and so on

## libraries
The apps use [git](https://git-scm.com/) and [cloc](https://github.com/AlDanial/cloc) commands to calculate their statistics.

Such commands are wrapped in functions provided by different libraries
- [cloc-functions](./src/cloc-functions/readme.md): wraps the [cloc](https://github.com/AlDanial/cloc) to provide different output, e.g. a dictionary of the files in a repo with the information about their lines of code or the differences, in terms lines of code/comment/blank added/deleted/renamed in a certain period of time
- [git-functions](./src/git-functions/): wraps different [git](https://git-scm.com/) commands, such as [git log](https://git-scm.com/docs/git-log) or [git diff](https://git-scm.com/docs/git-diff) to provide different output, e.g. the list of all commits in a certain period of time or the differences between the files comparing two different commits
- [git-cloc-functions](./src/git-cloc-functions/README.md): combines [git](https://git-scm.com/) and [cloc](https://github.com/AlDanial/cloc) commands to provide a more comprehensive set of information about the changes that have occurred in a repo in certain period of time

## use of rxJs 
**git-metrics** uses extensively the [rxJs](https://rxjs.dev/) library.

The reason is that the [git](https://git-scm.com/) and [cloc](https://github.com/AlDanial/cloc) commands are often executed asynchronously using the node [child-process](https://nodejs.org/api/child_process.html) functions in their 'callback based' form (i.e. [exec](https://nodejs.org/api/child_process.html#child_processexeccommand-options-callback) and [spawn](https://nodejs.org/api/child_process.html#child_processspawncommand-args-options)).

The [child-process](https://nodejs.org/api/child_process.html) 'callback based' functions are turned into [rsJs Observables](https://rxjs.dev/guide/observable) using functions provided in [execute-command](./src/tools/execute-command/).

Converting 'callback based' functions into Observable streams allows to conveniently manipulate such streams via [rxJs](https://rxjs.dev/) operators.