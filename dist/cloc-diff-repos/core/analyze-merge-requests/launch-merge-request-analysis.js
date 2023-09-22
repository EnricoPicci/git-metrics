"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.launchMergeRequestAnalysis = void 0;
const commander_1 = require("commander");
const launch_analysis_1 = require("./internals/launch-analysis");
function launchMergeRequestAnalysis() {
    console.log('====>>>> Launching Merge Request Analysis');
    const { gitLabUrl, token, groupId, outdir } = readParams();
    (0, launch_analysis_1.launchMergRequestAnalysisInternal)(gitLabUrl, token, groupId, outdir).subscribe();
}
exports.launchMergeRequestAnalysis = launchMergeRequestAnalysis;
function readParams() {
    const program = new commander_1.Command();
    program
        .description('A command to analyze the merge requests of a gitlab group')
        .requiredOption('--gitLabUrl <string>', `gitlab server (e.g. gitlab.example.com)`)
        .requiredOption('--token <string>', `private token to access the gitlab api (e.g. abcde-Abcde1GhijKlmn2Opqrs)`)
        .requiredOption('--groupId <string>', `id of the group to analyze (e.g. 1234)`)
        .option('--outdir <string>', `directory where the output files will be written (e.g. ./data) - default is the current directory`);
    const _options = program.parse(process.argv).opts();
    const outdir = _options.outdir || process.cwd();
    return { gitLabUrl: _options.gitLabUrl, token: _options.token, groupId: _options.groupId, outdir };
}
//# sourceMappingURL=launch-merge-request-analysis.js.map