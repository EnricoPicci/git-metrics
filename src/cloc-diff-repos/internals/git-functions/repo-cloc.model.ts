import { ClocLanguageStats } from "../../../cloc-functions/cloc.model";

// RepoClocStats is an interface for the cloc stats of a repo
export interface RepoClocLanguageStats {
    repoPath: string;
    clocStats: ClocLanguageStats[];
}