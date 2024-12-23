# git-metrics

Tools to calculate some metrics out of git. It uses [git](https://git-scm.com/) and [cloc](https://github.com/AlDanial/cloc) commands.

This [article](https://betterprogramming.pub/a-data-driven-approach-to-improve-systems-understandability-d66369f75db) describes the spirit of this tools.

# Table of Contents

1. [OVERVIEW](#overview)
2. [TOOLS TO ANALYZE REPOS - IN MEMORY AGGREGATION](#tools-to-analyze-repos---in-memory-aggregation)
    1. [BASIC LOGICAL STEPS](#basic-logical-steps)
    2. [RUN TOOLS TO ANALYZE A SINGLE REPO](#run-tools-to-analyze-a-single-repo)
        1. [PARALLEL READS](#parallel-reads)
    3. [RUN BRANCHES REPORT](#run-branches-report)
    4. [RUN TOOLS TO MERGE AND ANALYZE ALL THE REPOS CONTAINED IN A FOLDER AS A SINGLE PROJECT](#run-tools-to-merge-and-analyze-all-the-repos-contained-in-a-folder-as-a-single-project)
    5. [RUN TOOLS TO ANALYZE MANY REPOS](#run-tools-to-analyze-many-repos)
    6. [OPTIONS](#options)
    7. [RESULTS PRODUCED](#results-produced)
        1. [summary excel file](#summary-excel-file)
        2. [cvs files](#csv-files)
            1. [\*-files-chrn.csv](#*-files-chrn.csv)
            2. [\*-writeModulesChurCsv.csv](#*-writeModulesChurCsv.csv)
            3. [\*-authors-churn.csv](#*-authors-churn.csv)
            4. [\*-files-authors.csv](#*-files-authors.csv)
            5. [\*-writeFilesCouplingCsv.csv](#*-writeFilesCouplingCsv.csv)
            6. [\*-branches.csv](#*-branches.csv)
    8.
3. [TOOLS TO ANALYZE MULTIPLE REPOS FOR TRACES OF COUPLING](#tools-to-analyze-multiple-repos-for-traces-of-coupling)
    1. [THE INTUITION](#the-intuition)
    2. [EXAMPLE](#example)
    3. [BASIC LOGICAL STEPS](#basic-logical-steps-1)
    4. [Example of logical steps](#example-of-logical-steps)
    5. [RUN TOOLS TO ANALYZE MULTIPLE REPOS FOR TRACES OF COUPLING](#run-tools-to-analyze-multiple-repos-for-traces-of-coupling)
        1. [Options](#options-1)
4. [DESIGN](#design)
    1. [Mapping of pipelines phases to code](#mapping-of-pipelines-phases-to-code)
    2. [Folder dependency tree](#folder-dependency-tree)
5. [TOOLS TO ANALYZE A SINGLE REPO - PARTIAL AGGREGATION IN MONGO](#tools-to-analyze-a-single-repo---partial-aggregation-in-mongo)
    1. [BASIC LOGICAL STEPS IF MONGODB IS USED](#basic-logical-steps-if-mongodb-is-used)
    2. [RUN TOOLS TO ANALYZE A SINGLE REPO WITH MONGODB](#run-tools-to-analyze-a-single-repo-with-mongodb)
        1. [Options that can be used when using Mongo](#options-that-can-be-used-when-using-mongo)

# OVERVIEW
Data stored in the git commit records add the dimension of time and contributors to the analysis of code. In other words it tells how a codebase has evolved over time and who has done what.

Analyzing a codebase using the time and contributor dimension can cast some light on the work performed on a certain repo. For instance, looking at the parts of a codebase which have moved most in a certain period of time, we can derive where probably most of the work has been concentrated. 

Other analysis are possible, for instance looking at the contributors and their work over time.

The tool can be run via the command `npx git-metrics <sub-command> <parameters>` (where <sub-command> is the name of sub-commnad we want to launch, i.e. the type of analysis we want to perform, and <parameters> are the parameters required by the specific sub-command).

We can also install the package locally and the run the command directly within [node](https://nodejs.org), e.g.

`node ./dist/lib/command.js <sub-command> <parameters>`.

Running the command `npx git-metrics` prints the list of all available sub-commands.

Running the command `npx git-metrics <sub-command> --help` prints the list of parameters required for a specific subcommand.

# code-turnover
**code-turnover** is the measure of how many lines of code have been added or removed or modified in a certain period of time.

It may be considered a proxy of the effort spent by developers on a certain codebase. 

For instance, if in the month oj June we see that the **code-turnover** of a certain repo is 0, then we can deduce (with some approximation) that no effort has been spent on that repo. On the other hand, if we see that ***repo-A*** has a **code-turnover** of 10.000 and, in the same period of time, ***repo-B*** has a **code-turnover** of 1.000, we can suspect that much more work has been spent on ***repo-A*** than on ***repo-B***.

**code-turnover** is a relative measure, not an absolute one, and should be used to highlight possible areas of investigation. In other words, it should be used to help us ask the right questions and not to provide us answers. Still, with all these limitations in mind, it is an objective quantitative measure that can be combined with other more qualitative considerations to help us better understand our codebases.

The **code-turnover** analysis can be launched with the `code-turnover` sub-command as explained in more details in the [code-turnover README file](./src/apps/code-turnover/README.md). 

<!-- # TOOLS TO ANALYZE REPOS - IN MEMORY AGGREGATION

## BASIC LOGICAL STEPS

-   The git log info is read using the command

`git log --all --numstat --date=short --pretty=format:'§§§%h§§§%ad§§§%aN§§§%cN§§§%cd§§§%s' --no-renames` (`§§§` is just the separator used)

-   Data about number of lines of code is collected using the [cloc](https://www.npmjs.com/package/cloc) utility via the command "`npx cloc . --by-file --csv`" and saved in 2 separate files
-   Once the data is written on the files, the reports can be generated. Reports are generated running some aggregation logic starting from the data saved in the files, the type of aggregation depends on the report
-   The aggregation logic creates a stream that is used to perform the calculations required by the report
-   Once the report has been generated, some summary considerations are added to the report
-   Some general info about the project (i.e. about the files contained in the repo folder) are also generated

We say that this logic implements "in memory" aggregagtion since all the aggregation logic runs in the node thread, i.e. in memory.

This design though allows also to use an external DB to run at least part of the aggregation logic. An initial implementation of this different approach is contained in the "mongo" folder and its logic is described later.

See also the architectural diagrams at the end of this README for a more visual description of the steps.

## RUN TOOLS TO ANALYZE A SINGLE REPO

To run the tool you should move to the folder containing the git repo and, from there, use the tool via npx like this

`npx git-metrics`

Options can be added to this command to control the behaviour of the tool.

For example, the following command analyzes the repo contained in the current folder and runs all the reports. It considers only the Typescript files which have been changed after 2021-01-01. The logs produced by the analysis are stored in the ../logs folder.

`npx git-metrics -f '*.ts*' -a 2021-01-01 -d ../logs`

You can also install the 'git-metrics' package from npm, move to the directory containing the git repo and launch the command

`node path-to-git-metrics/dist/3-lib/run-reports-on-repo-parallel-reads.js`

### PARALLEL READS VS ONE PROCESS ONLY

By default all the read operations, i.e. the execution of the `git log` and `npx cloc` commands, are performed in distinct separate processes which are spawned by the main Node process. When all the read operations complete and produce their respective output files, such files are read concurrently in the main Node process and the reports are generated out of them.

It is possible also run the reports using only the main Node process by launching the command

`npx -p git-metrics run-reports-single-thread`

## RUN BRANCHES REPORT

The BranchesReport is different from the other reports in the sense that, in order for it work correctly, it has to consider ALL commits since the birth of the repo. This means that neither `filter` nor `after` options can be used.

Moreover it needs to process the commits from the eldest to the newest, and so the `reverse` option of `git log` has to be used.

For these reasons it is not launched by the default `git-metrics` command but has to be launched by the following command

`npx -p git-metrics run-branches-report`

This report saves its results in a file ending with `*-branches.csv`.

## RUN TOOLS TO MERGE AND ANALYZE ALL THE REPOS CONTAINED IN A FOLDER AS A SINGLE PROJECT

There are cases when it could be interesting to analyze all the repos contained in a single folder as they were a single project, for instance when a single team uses a multi repo approach to develop a solution.

This can be achieved using the command like this

`npx -p git-metrics run-all-reports-on-merged-repos`

The reports produced merge the git logs of the different repos and treat them as a single logical git log.

## RUN TOOLS TO ANALYZE MANY REPOS

We can also run the tool to analyze many repos which are passed as parameters. In this case we can use the tool like this

`npx -p git-metrics run-reports-on-multi-repos -r 'path_1' 'path_2'`

where 'path_1' and 'path_2' represent the paths to the folders that contain the repos we want to analyze.

## OPTIONS

-   '--reports <string...>': reports to be run (the default is all reports) - report names have to be specified with single quotes and have to be separated by spaces like this --reports 'FileChurnReport' 'ModuleChurnReport'
-   '-r, --repo <string>': path to the folder containing the repo (the current folder name is the default)
-   '-f, --filter <string...>': optional filter(s) to be used (e.g. '_.ts_' to select typescript files - make sure the filter is between single quotes)
-   '-a, --after <string>': the date from which the analysis starts from (format YYYY-MM-DD), commits previous to this date are ignored
-   '-b, --before <string>': the date in which the analysis ends (format YYYY-MM-DD), commits after this date are ignored
-   '-d, --outDir <string>': folder where the log file created by git log command will be written
-   '-o, --outFilePrefix <string>': the prefix of the name of the log file written as result of creating a report (default is the name of the repo)
-   '--depthInFilesCoupling <string>': if we sort the files for number of commits, we consider for coupling only the ones with more commits, i.e. the ones which remain within depthInFilesCoupling (default value is 10)`
-   '-c, --concurrentReadOfCommits'': if this option is specified, then the file containing the commit records is read concurrently in the processing of all reports, this can reduce the memory consumption
-   '--noRenames': if this opion is specified, then the no-renames option is used in the git log command
    npx -p git-metrics run-reports-single-thread
-   '--countClocZero': if this opion is specified, then also the files that have 0 lines of code are counted (this can be the case for files have been deleted or renamed in the past but are still present in the repo referenced by old commits)`,

## RESULTS PRODUCED

The goal of the git-metrics tool is to run some analysis on a code base which uses git as its CVS.

The results of the analysis are:

-   some files (_.csv and _.log) containing the details produced by the analysis
-   a summary excel file containing the data of the various csv files in different tabs (currentlyh written only by the commands 'run-reports' and 'run-reports-single-thread')
-   some print outs containing higher level considerations drawn from the details of the analysis

## summary excel file

When we run the git-metrics tool a summary excel is produces. This excel file will contain a sheet for each csv file produced with all the csv records turned into sheet's rows. The summary file is not produced for the Branches Report.

## csv files

### \*-files-chrn.csv

There is a line for each file which has been changed at least once since the start date (i.e. the date, if any, specified with the --after option). The sources of data are the "git log" command and the [cloc](https://www.npmjs.com/package/cloc) tool

For each file this is the data calculated

-   path: path of the file
-   cloc: number of lines of code (blanks and comments are not considered), this number is calculated with the [cloc](https://www.npmjs.com/package/cloc) tool
-   linesAdded: number of lines added in the period considered (i.e. after the date, if any, specified with the --after option) from git log
-   linesDeleted: number of lines deleted in the period considered (i.e. after the date, if any, specified with the --after option) from git log
-   commits: number of commits for this file in the period considered (i.e. after the date, if any, specified with the --after option) from git log
-   created: date the file has been created, calculatd as the date of the first commit (fisrt commit in absolute terms, not relative to the period of analysis)
-   linesAddDel: sum of the lines added and deleted, this is considered the proxy for the amount of work spent on the specific file
-   cumulativeChurnPercent: consider to sort the files for their contribution to the churn in decreasing order, this property contains the cumulative percentage of churn if we sum all the files up to this one; it is used to show, for instance, how many files contribute to 80% of the churn
-   cumulativeNumberOfFilesPercent: consider to sort the files for their contribution to the churn in decreasing order, this property represents how many files, in percentage, have been considered up to this one
-   churnRanking: the ranking of files in terms of their contribution to the churn, the value 1 represents the file which contributes most to the churn

### \*-writeModulesChurCsv.csv

There is a line for each module which has seen a change at least once since the start date (i.e. the date, if any, specified with the --after option).

A module is considered any folder which contains in its subtree at least one of the files selected for the analysis. This is, in other words, an aggregated view of the results of "\*-files-chrn.csv".

For each module we calculate the same info as in the case of "\*-files-chrn.csv" with the exception of the number of commits.

The sources of data are the "git log" command and the [cloc](https://www.npmjs.com/package/cloc) tool.

The files "_-module-churn.csv" stores the "git log" output data used to calculate the "_-writeModulesChurCsv.csv".

### \*-authors-churn.csv

There is a line for each author (i.e. developer) which has contributed with at least one commit since the start date (i.e. the date, if any, specified with the --after option).

For each author this is the data calculated

-   authorName: name of the developer who has authored the change
-   linesAdded: number of lines added in the period considered (i.e. after the date, if any, specified with the --after option) from git log
-   linesDeleted: number of lines deleted in the period considered (i.e. after the date, if any, specified with the --after option) from git log
-   firstCommit: the date of the first commit issued by the author in the period considered (i.e. after the date, if any, specified with the --after option) from git log
-   lastCommit: the date of the last commit issued by the author in the period considered (i.e. after the date, if any, specified with the --after option) from git log
-   linesAddDel: sum of the lines added and deleted, this is considered the proxy for the amount of work performed by the author
-   commits: number of commits issued by the author in the period considered (i.e. after the date, if any, specified with the --after option) from git log

### \*-files-authors.csv

There a line for each file which contains the same data as in "\*-files-chrn.csv" and, in addition to that, also the number of authors that have contributed to the change (as authors of commit) on the specific file.

The number of authors that have contributed to the change of a file is considered a proxy for knowledge sharing.

### \*-writeFilesCouplingCsv.csv

There is a line for each pair of files which have changed together in the same commits.

For each pair (let's cal the 2 files in the pair: firstFile and secondFile) this is the data calculated

-   linesAdded: number of lines added to firstFle in the period considered (i.e. after the date, if any, specified with the --after option) from git log
-   linesDeleted: number of lines deleted to firstFle in the period considered (i.e. after the date, if any, specified with the --after option) from git log
-   path: path of firstFile
-   cloc: number of lines of code of firstFile (blanks and comments are not considered), this number is calculated with the [cloc](https://www.npmjs.com/package/cloc) tool
-   comment: number of lines of comment of firstFile
-   blank: number of blank lines of firstFile
-   totCommitForFile: number of commits in which firstFile was present in the period considered (i.e. after the date, if any, specified with the --after option) from git log
-   coupledFile: path of the secondFile
-   totCommitsForCoupledFile: number of commits in which secondFile was present in the period considered (i.e. after the date, if any, specified with the --after option) from git log
-   howManyTimes: number of times the secondFile has been committed in a commit which contained the firstFile
-   totNumberOfCommits: total number of commits in the period considered (i.e. after the date, if any, specified with the --after option), it is the same for all rows since the total number of commits in the period does not change depending on the files of the pair considered
-   howManyTimes_vs_totCommits: ratio between how many times secondFile has changed together with firstFile vs how many times first file has changed (independent from secondFile changing), this measure is a proxy for coupling. If the number of times secondFile changes together with firstFile is the same as the total number of times firstFile changes, this means that secondFile and firstFile change always together and therefore they are likely to be highly coupled

### \*-branches.csv

The objective of this report is to measure how many branches are available along the life of the project represented by the repo. In a "trunk based development" mode, there should be few branches that are kept available for developers along the life of the project. If many branches are left hanging around, than it means the team is using a different strategy.

Since for Git a branch is simply a tag attached to a commit and this tag moves from one commit to the following over time, we can only get a proxy of the branches actually active in a certain day. The approximation is the following: we consider a commit to be a "branch tip", i.e. the last commit representing a branch, if the commit does not have any children at the end of the day considered. It is an approximation since, for instance, a "stash" is a commit with no children.

If we consider the following scenario

![Commit history](./readme-diagrams/commit-history.png?raw=true)

-   at the end of "day 1": we have that, at the end of "day 1" there is only "commit 1" which does not have any children (at the end of "day 1" at least), so it represent the one and only one branch tip present at the end of "day 1".
-   at the end of "day 2": "commit 2" and "commit 3" represent 2 tips of 2 different branches.
-   at the end of "day 3": at the end of "day 3" Branch A gets merged into master and Branch B has been created, so we have 2 branches, master and Branch B, which are represented by the "merge" commit (merge of Branch A into master) and "commit 4" respctively.

There is a line for each day where at least one commit has been performed.
This line represents a summary of the activities performed in the day, from the commit and branches stand point.

For each day this is the data calculated

-   day: the day the summary refers to - in this date at least one commit has been performed
-   linesAdded: number of lines added in all commits performed in the day
-   linesDeleted: number of lines deleted in all commits performed in the day
-   linesAddDel: number of lines added and deleted in all commits performed in the day
-   branchTips: number of commits that represent a branch tips, i.e. have no children, at the end of the day considered
-   deltaBranchTips: difference of branch tips with respect to the previous day which showed a commit
-   numberOfCommitsMergedInTheDay: number of commits merged in the day
-   numberOfCommitsWithNoFutureChildren: number of commits which have no children, at least up until now
-   numberOfBranchTipsWhichWillHaveChildren: number of commits which represent branch tips at the end of this day, but the eventually will have childred and therefore are not branch tips any more
-   commitsWithNoFutureChildren: commit hashes which have no children, at least up until now

## DOCKER

### build

To build a docker image run the command `docker build -t git-metrics .`

### Publish

To publish the image to docker hub run the command first tag the image with the command

`docker tag git-metrics 290764/git-metrics:git-metrics`

and then push it with the command

`docker push 290764/git-metrics:git-metrics`

### Run

To run the local image (assuming the local directory ~/my-repo/ contains the git repo)

`docker run --rm -v ~/my-repo/:/usr/src/app -v ~/logs/:/outdir git-metrics -f '*.java' '*.ts' -a 2023-01-01 -d /outdir`

To run the published image (assuming the local directory ~/my-repo/ contains the git repo)

`docker run --rm -v ~/my-repo/:/usr/src/app -v ~/logs/:/outdir 290764/git-metrics:git-metrics -f '*.java' '*.ts' -a 2023-01-01 -d /outdir`

# TOOLS TO ANALYZE MULTIPLE REPOS FOR TRACES OF COUPLING

## THE INTUITION

The intuition is to see if a certain file of one repo is committed often together with other specific files coming from other repos. Since the repos are independent units, we can rely only on the time dimension to give us indications about the potential coupling of 2 or more files. Therefore, to say that a file in one repo is committed **together with** another file from another repo, we have to see if the 2 files are committed in the same time period.

## EXAMPLE

Let's consider 2 repos, _Repo_1_ and _Repo_2_. _Repo_1_ contains _File_A_ wwhile _Repo_2_ contains _File_B_.

If we observe that very often _File_A_ is committed also _File_B_ is committed, we can start suspecting that there is an high probability that a change in _File_A_ requires some change in _File_B_, i.e. _File_A_ is coupled with _File_B_.

But what does it mean the **very often** written above since the 2 repos are independent units and do not share any info about their respective commits? We can use the **time dimension** to define the concept of **very often**. In other words we can split the timeline in time windows of a specified length, e.g 7 days, and observe whether _File_A_ and _File_B_ are committed in the same time window. If we see that many times we encounter _File_A_ in a time window we fnd also _File_B_, this for us is the **very often** concept used above.

## BASIC LOGICAL STEPS

-   For each repo under analysys, the git commit data is read via the `git log` command as specified in the case of the analysis of a single repo
-   The period of the analysis, i.e. the period from the date specified in the `after` parameter and now, is split in time windows whose length, in days, is passed as a parameter when launching the analysis. All commits per each file in each repo are grouped by the time window they fall in. We can therefore count in how many time windows we encouter that a certain file has been committed.
-   The time windows which have at least 1 commit with 1 file in all repos are selected. In other words, if for a certain time window a certain repo does not have any commit, then that window is not considered for the further steps of the analysis
-   For each time window all possible tuples of files are calculated. A tuple of file is the combination of 1 file per repo. So, if there are 2 repos under analysis, then the tuples contain 2 files, one from each repo. In other word, a tuple contains one file per each repo which has been committed at least once in the time window.
-   Then all tuples are grouped. In other words we count in how many time windows a certain tuple has appeared.
-   Once we know in how many time windows a certain tuple has appeared and in how many time windows a file contained in the tuple has been committed, then we can calculate an index of potential coupling as the ratio between **"number of time windows where a certain tuple appears"** vs **"number of time windows where a certain file has been committed"**.

### Example of logical steps

Let's consider 2 repos, _Repo_1_ and _Repo_2_. _Repo_1_ contains _File_A_ wwhile _Repo_2_ contains _File_B_.

Let's assume also that the length of the time window considered is 1 day, so we analyze the commits grouped by the day they occurred.

Let's assume that we observe that _File_A_ and _File_B_ are committed in the same day for 20 times. This means that there are 20 time windows where we find the tuple [*File_A*, *File_b*] (**"number of time windows where a certain tuple appears"** = 20).

Now let's assume also that there are no other time windows where we observe that _File_A_ is committed, thererfore **"number of time windows where a certain file has been committed"** = 20. This would mean that, according to the data we observe, any time _File_A_ is committed also _File_B_ is committed.

In this case, for _File_A_, the ratio between **"number of time windows where a certain tuple appears"** vs **"number of time windows where a certain file has been committed"** would equal to 1. Therefore an high value of this ratio represents an indication that there MIGHT be coupling between _File_A_ and _File_B_. It is important to stress that this is only an indication. Our expert judgment has to evaluate every case to see whether it makes sense to perform some follow up analysis.

## RUN TOOLS TO ANALYZE MULTIPLE REPOS FOR TRACES OF COUPLING

To run the tool that produces the repo you have to execute the command

`npx -p git-metrics run-repo-coupling-report -r path-to-repo-1 path-to-repo-2 path-to-repo-n`

where after the -r options you specify the paths to the folders containing the repos to be analyzed to find clues of coupling.

### options

-   -r, --repoFolderPaths <string...> path to the folders containing the repos which we want to analize for coupling ('path_1' 'path_2')
-   -t, --timeWindowDays <number> lenght of the time window in days, defualt is 1 (default: "1")
-   --csvFilePath <string> path of the csv file built (default is repo-coupling.csv in the outDir folder)
-   -f, --filter <string...> optional filter to be used (e.g. '_.ts_' to select typescript files - make sure the filer is between single quotes)
-   -a, --after <string> date to start from (format YYYY-MM-DD)
-   -d, --outDir <string> folder where the log file created by git log command will be written (default ./) (default: "./")
-   -o, --outFile <string> name of the log file written (default is the name of the repo)
-   --outClocFile <string> log file containing the cloc info (default is the name of the repo with -cloc postfix)
-   --clocDefsFile <string> path of the file that contains the language definitions used by cloc (sse "force-lang-def" in
    http://cloc.sourceforge.net/#Options)
-   -h, --help display help for command

# DESIGN

## Mapping of pipelines phases to code

The various phases of the transformation pipelines are mapped to specific folders containing all the code that runs each specific phase, as illustrated in the diagram.

![Pipeline phases to code mapping diagram](./readme-diagrams/pipeline-phases-to-code-mapping.png?raw=true)

"Folder dependency diagram"

## Folder dependency tree

Source code is organized in folder which aim to isolate logical components. The dependencies among these components are illustrated in the following diagrams

![Dependency diagram](./readme-diagrams/dependency-diagram.png?raw=true)

"Folder dependency diagram"

# TOOLS TO ANALYZE A SINGLE REPO - PARTIAL AGGREGATION IN MONGO

## BASIC LOGICAL STEPS IF MONGODB IS USED

-   The steps to create the files with the git commit records and the cloc data are the same as for the in memory aggregation approach
-   The data collected from git and with cloc are then used to load 2 mongodb collections, one that stores the data relative to the commits and one that flatten the commit info and stores one document per each file encountered in each commit (so if the same file is present in 2 commits, this last collection has 2 entries for that file, each relative to a different commit)
-   Loading the files into mongodb is itself divided into subphases: the first loads the data, the second calculates the age of the file (i.e. the first time a file has been commited)
-   Once the data is loaded into mongodb, the reports can be generated. Reports are generated running a query on the mongodb, the type of query depends on the report, and using the data streamed from mongodb to perform the calculations required by the report
-   The reason we have chosen to load data into a mongodb is that it moves part of the aggregation logic to the mongodb engine which can improve performace and can allow to process big repos without requiring as much memory as it would be required by the in memory processing

## RUN TOOLS TO ANALYZE A SINGLE REPO WITH MONGODB

To run the tool with mongodb you need to have a mongodb instance running, either locally or on a server, and provide the connection string like this

`npx -p git-metrics load-mongo-run-reports -s connectionStringToMongo`

There are some specific options for mongo. For instance, launching the followint command will use a local mongodb instance. The updates on mongodb will be done in buffers of 100 documnents and there will be a concurrency of 50 while accessing mongo (i.e. up to 50 parallel sessions). A message about the progress of the elaboration will be printed on the console.

`npx -p git-metrics load-mongo-run-reports -s mongodb://localhost:27017 -f '*.ts*' -a 2021-01-01 -d ../logs -b 100 --logProgress true --mongoConcurrency 50`

### Options that can be used when using Mongo

-   '-s, --connStr <string>': connection string to use to connect to mongo
-   '--dbName <string>': name of the db to use (the name of the repo is the defalt)
-   '-c, --collName <string>': name of the collection to use (the name of the log file is the defalt)
-   '-b, --buffer <number>': size of the batches of documents for the load operation
-   '--clocDefsFile <string>': path of the file that contains the language definitions used by cloc (sse "force-lang-def" in http://cloc.sourceforge.net/
    #Options)`
-   '--logProgress <boolean>': logs the progress in loading the mongo db with documents (default is false);
-   '--mongoConcurrency <number>': concurrency level used in insert and update operations (default is 1, i.e. no concurrency) -->
