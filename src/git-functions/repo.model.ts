import { CommitCompact } from "./commit.model";

export interface RepoCompact {
    path: string;
    commits: CommitCompact[];
}