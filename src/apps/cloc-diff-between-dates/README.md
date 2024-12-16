# cloc-diff-between-dates
**cloc-diff-between-dates** calculates the differences in the lines of code/comments/blanks between two dates in a set of repos contained in a folder.

It generates the following output:
- a csv file with the differences in the lines of code/comments/blanks between the two dates for each repo
- an error log file where the errors occurred during the execution are logged
- a command log file where the commands executed during the execution are logged

## Fields in the csv file produced
The csv file produced has the following fields:
- **language**: The programming language of the file.
- **file**: The path to the file within the repository.
- **extension**: The file extension.
- **blank_same**: The number of blank lines that remained unchanged.
- **blank_modified**: The number of blank lines that were modified.
- **blank_added**: The number of blank lines that were added.
- **blank_removed**: The number of blank lines that were removed.
- **comment_same**: The number of comment lines that remained unchanged.
- **comment_modified**: The number of comment lines that were modified.
- **comment_added**: The number of comment lines that were added.
- **comment_removed**: The number of comment lines that were removed.
- **code_same**: The number of code lines that remained unchanged.
- **code_modified**: The number of code lines that were modified.
- **code_added**: The number of code lines that were added.
- **code_removed**: The number of code lines that were removed.
- **isCopy**: A boolean indicating if the file is a copy.
- **from_code**: The number of code lines at the start date of the comparison(*).
- **from_comment**: The number of comment lines at the start date of the comparison(*).
- **from_blank**: The number of blank lines at the start date of the comparison(*).
- **to_code**: The number of code lines at the end date of the comparison.
- **to_comment**: The number of comment lines at the end date of the comparison.
- **to_blank**: The number of blank lines at the end date of the comparison.
- **from_sha**: The Git commit hash of the commit found at date of the start of the comparison (or the one immediately before if no commit is found at the start date of the comparison)(**).
- **from_sha_date**: The date of the commit from which we start the comparison(**).
- **to_sha**: The Git commit hash of the commit found at date of the end of the comparison (or the one immediately before if no commit is found at the start date of the comparison).
- **to_sha_date**: The date of the commit where we end the comparison.
- **repo**: The repository path.
- **module**: The module path (i.e. the folder of the file).
- **area**: The name of the top folder of the file path (after removing the folder path from which the analysis started).

(*) The fields `from_code`, `from_comment`, and `from_blank` have value 0 if there is no commit at the start or before the date of the comparison.\
(**) The fields `from_sha` and `from_sha_date` are blank if there is no commit at the start or before the date of the comparison.

## Additional fields that can be calculated if "markForKeywordsInstruction" parameter is provided
Via the "markForKeywordsInstruction" parameter it is possible to define a series of instructions to mark the files that contain certain keywords in specific fields of the output produced by **cloc-diff-between-dates**.\ 
This mechanism can be used, for instance, to mark the files that contain certain keywords in their file path.\ 
Each instruction contains the following fields:
```json
{
    "searchFieldName": "file",  // The field where the search will be performed
    "markFieldName": "contains_generated",  // The field that will be added - this field will have the value true if the search is successful, false otherwise
    "keywords": ["generated", "stub"] // The keywords to search for
}
```
The above example will add a field `contains_generated` to the output with value true if the file path contains the words "generated" or "stub", false otherwise.

## How to run
The parameters can be passed to the script in two ways:
- via a json file
- via command line arguments
The `markForKeywordsInstruction` parameter can be passed just via json file.\
To launch the script with a json file, run the following command:
```bash
npx git-metrics@latest cloc-diff-between-dates --params-json ./path/to/params.json
```
To launch the script with command line arguments, run the following command (here only some parameters are shown):
```bash
npx git-metrics@latest cloc-diff-between-dates --folderPath path/to/forlder/with/repos --fromDate 2024-01-01 --toDate 2024-12-11 --languages "Java" "TypeScript" "Kotlin"  --outdir path/to/outdir
```

## Logic of the script
The tool a chain of “cloc” and “git” commands to calculate the various measures of LoC.\
The commands launched for each repo are the following:
- Get the default branch
    - git config --get remote.origin.url
    - git branch --remotes --list '*/HEAD'
- Get the commit hash at start date (or the one just before that date if none is found at that date)
    - git log -n 1 --before=startDate defaultBranch
- Get the commit hash at end date (or the one just before that date if none is found at that date)
    - git log -n 1 --before=endDATE defaultBranch
- Checkout the commit at start date (if there is one) and count LoC at start date with “cloc”
    - git checkout commitAtStartDate
    - npx cloc .
- Checkout the commit at start date and count LoC at end date with “cloc”
    - git checkout commitAtEndDate
    - npx cloc .
- Calculate the LoC added, removes, modified, same between the commits at start and date with the command “cloc --git-diff-rel”
    - cloc --git-diff-rel --by-file --ignore-whitespace commitAtStartDate commitAtEndDate
- Identify files which change between the start and end date because are just copies with the command “git diff  -M50%”
    - git diff --numstat -M50%

## Logs of the execution
The tool generates two log files:
- **prefix-cmd-errored-timestamp.log**: contains the errors that occurred during the execution
- **prefix-cmd-executed-timestamp.log**: contains the commands executed during the execution