# cloc-functions
cloc-functions contains functions that work with the [cloc](https://github.com/AlDanial/cloc) command and return its results in various forms.

## cloc.ts
Executes the [cloc](https://github.com/AlDanial/cloc) in its simplest form, to obtain a summary view of the number of files, lines of code (loc), blanks and comments for files in a folder, groued by language.

It has also functions which run the  [cloc](https://github.com/AlDanial/cloc) command with the `--by-file` option, to obtained a detailed view of loc, blanks, comment and language.

## cloc-dictionary.ts
Tranform the results of the  [cloc](https://github.com/AlDanial/cloc) command into a dictionary whose keys are the paths of the files and whose values are the information returned by the [cloc](https://github.com/AlDanial/cloc) command (i.e. lines of code, blanks, comment and language).

## cloc-diff.ts
Runs the [cloc](https://github.com/AlDanial/cloc) command with the `--git-diff-all` option to calculate the difference between 2 commits, in terms of lines added, lines removes and lines modified. Returns the result in the form of an objects that describes the difference between the two commits.