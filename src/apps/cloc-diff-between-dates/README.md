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

(*) The fields `from_code`, `from_comment`, and `from_blank` have cvalue 0 if there is no commit at the start or before the date of the comparison.\
(**) The fields `from_sha` and `from_sha_date` are blank if there is no commit at the start or before the date of the comparison.