"use strict";
// node ./dist/read-git/scripts/read-git-log -r ./test-data/git-repo -f '*.txt' -d ./test-data/output -o git-repo-from-script.log
Object.defineProperty(exports, "__esModule", { value: true });
exports.readGitLog = void 0;
const commander_1 = require("commander");
const read_git_1 = require("../read-git");
function readGitLog() {
    const program = new commander_1.Command();
    program
        .description('A command to perform git log command against a git repo and write the output on a file')
        .option('-r, --repo <string>', 'path to the folder containing the repo (the current folder is the default)')
        .option('-f, --filter <string>', `optional filter to be used (e.g. '*.ts*' - make sure the filer is between single quotes)`)
        .option('-a, --after <string>', `date to start from (format YYYY-MM-DD)`)
        .option('-d, --outDir <string>', `folder where the log file will be written (default ${read_git_1.DEFAULT_OUT_DIR})`, `${read_git_1.DEFAULT_OUT_DIR}`)
        .option('-o, --outFile <number>', `name of the lof file written (default is the name of the repo)`);
    program.parse(process.argv);
    const options = program.opts();
    (0, read_git_1.readCommits)(options);
}
exports.readGitLog = readGitLog;
readGitLog();
//# sourceMappingURL=read-git-log.js.map