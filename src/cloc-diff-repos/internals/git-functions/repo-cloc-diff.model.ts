import { CommitCompact } from "./commit.model";

// CommitTuple is a type that represents a tuple of 2 commits or null
// #copilot - the entire type has been generated by copilot after I have written the comment above
export type CommitTuple = [CommitCompact, CommitCompact] | null;