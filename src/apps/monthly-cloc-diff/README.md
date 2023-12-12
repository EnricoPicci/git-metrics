# monthly-cloc-diff-for-repos
This is an app that takes one or more git repos and calculate the monthly diffenrences between commits of those repos.

The monthly difference is the difference between the last commit of a certain month and the the last commit of the previous month. The difference is calculated using the [cloc](https://github.com/AlDanial/cloc) command.

It may give an idea about a repo has developed over time but does not consider how much work and rework has been performed during the month.

A more precise idea about the work done on a repo is given by [**code-turnover**](../code-turnover-for-repos/README.md).