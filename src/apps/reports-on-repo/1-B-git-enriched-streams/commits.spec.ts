import { expect } from 'chai';
import path = require('path');
import { toArray, tap } from 'rxjs';
import { gitCommitStream, enrichedCommitsStream, filePathFromCommitPath, splitCommits } from './commits';

describe(`splitCommits`, () => {
    it(`returns a stream of arrays of strings, each array containing all the data related to a specific commit`, (done) => {
        const logFilePath = path.join(process.cwd(), '/test-data/output/git-repo-3-commits.gitlog');
        splitCommits(logFilePath)
            .pipe(toArray())
            .subscribe({
                next: (commits) => {
                    expect(commits.length).equal(3);
                    // top commit
                    expect(commits[0].length).equal(3);
                    // middle commit
                    expect(commits[1].length).equal(2);
                    // bottom commit
                    expect(commits[2].length).equal(3);
                },
                complete: () => done(),
            });
    });
});

describe(`enrichedCommitsStream`, () => {
    const commitLogPath = `${process.cwd()}/test-data/output/a-git-repo-commits.gitlog`;
    const clocLogPath = `${process.cwd()}/test-data/output/a-git-repo-cloc.gitlog`;
    it(`reads the commit and cloc info and generates a stream of commitDocs`, (done) => {
        enrichedCommitsStream(commitLogPath, clocLogPath)
            .pipe(
                tap({
                    next: (commit) => {
                        expect(commit).not.undefined;
                    },
                }),
                toArray(),
                tap({
                    next: (allCommits) => {
                        expect(allCommits.length).equal(3);
                        allCommits.forEach((commit) => {
                            expect(commit.files.length).gt(0);
                            commit.files.forEach((f) => {
                                expect(f.linesAdded).gte(0);
                                expect(f.linesDeleted).gte(0);
                                expect(f.code).gt(0);
                            })
                        })
                    },
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    });
    it(`returns a stream of arrays of strings, each array containing all the data related to a specific commit
    the csv log contains the file names starting with './' (this is the format of the file paths when the cloc
        command is used without the --vcs=git option)`, (done) => {
        const clocLogPath = path.join(process.cwd(), '/test-data/output/a-git-repo-cloc-with-dot-slash.gitlog');
        enrichedCommitsStream(commitLogPath, clocLogPath)
            .pipe(
                tap({
                    next: (commit) => {
                        expect(commit).not.undefined;
                    },
                }),
                toArray(),
                tap({
                    next: (allCommits) => {
                        expect(allCommits.length).equal(3);
                        allCommits.forEach((commit) => {
                            expect(commit.files.length).gt(0);
                            commit.files.forEach((f) => {
                                expect(f.linesAdded).gte(0);
                                expect(f.linesDeleted).gte(0);
                                expect(f.code).gt(0);
                            })
                        })
                    },
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    });
    it(`reads the commit and cloc info and generates a stream of commitDocs - considers only commits after a certain date`, (done) => {
        const after = new Date('2021-01-01');
        enrichedCommitsStream(commitLogPath, clocLogPath, after)
            .pipe(
                tap({
                    next: (commit) => {
                        expect(commit).not.undefined;
                    },
                }),
                toArray(),
                tap({
                    next: (allCommits) => {
                        expect(allCommits.length).equal(1);
                    },
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    });
    it(`reads the commit and cloc info and generates a stream of commitDocs - the files in the commit are not in the 
    cloc to simulate files that were present in an old commit but have been deleted since then.
    Even in this case though the cloc, comment and blank must not be undefined but need to be 0.
    This is required otherwise the file coupling records would have information missing and the cvs file could
    not be created correctly`, (done) => {
        const emptyClocLogPath = `${process.cwd()}/test-data/output/a-git-repo-cloc-empty.gitlog`;
        enrichedCommitsStream(commitLogPath, emptyClocLogPath)
            .pipe(
                tap({
                    next: (commit) => {
                        expect(commit).not.undefined;
                        expect(commit.files).not.undefined;
                        expect(commit.files.length).gt(0);
                        commit.files.forEach((f) => {
                            expect(f.code).equal(0);
                            expect(f.comment).equal(0);
                            expect(f.blank).equal(0);
                        });
                    },
                }),
                toArray(),
                tap({
                    next: (allCommits) => {
                        expect(allCommits.length).equal(3);
                    },
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    });
});

describe(`enrichedCommitsStream`, () => {
    const commitLogPath = `${process.cwd()}/test-data/output/a-git-repo-commits.gitlog`;
    const clocLogPath = `${process.cwd()}/test-data/output/a-non-existing-clof.gitlog`;
    it(`reads the commit info but does not find a cloc file, maybe because it has not been generated
    because the cloc tool can not work (e.g. there is no perl installed on the machine) - it generates a stream of 
    commitDocs where the number of lines of code, comments and blanks are set to 0 (and not null) so that the csv files can
    be generated with the correct records`, (done) => {
        enrichedCommitsStream(commitLogPath, clocLogPath)
            .pipe(
                tap({
                    next: (commit) => {
                        expect(commit).not.undefined;
                    },
                }),
                toArray(),
                tap({
                    next: (allCommits) => {
                        expect(allCommits.length).equal(3);
                        allCommits[0].files.forEach((f) => {
                            expect(f.code).equal(0);
                            expect(f.comment).equal(0);
                            expect(f.blank).equal(0);
                        });
                    },
                }),
            )
            .subscribe({
                error: (err) => done(err),
                complete: () => done(),
            });
    });
});

describe(`commitsStream`, () => {
    it(`returns a stream of GitCommitEnriched objects - one file is of type png and therefore has a not defined number of lines added and deleted
    which is set to 0`, (done) => {
        const logFilePath = path.join(process.cwd(), '/test-data/output/a-git-repo-png-file-commits.gitlog');
        gitCommitStream(logFilePath).subscribe({
            next: (commits) => {
                commits.files.forEach((f) => {
                    expect(f.linesAdded).gte(0);
                    expect(f.linesDeleted).gte(0);
                });
            },
            complete: () => done(),
        });
    });
});

describe(`filePathFromCommitPath`, () => {
    it(`returns the file path for a commit path that does NOT represent a rename`, () => {
        const commitPath = 'clients/src/main/java/org/apache/kafka/clients/admin/KafkaAdminClient.java';
        const path = filePathFromCommitPath(commitPath);
        expect(path).equal(commitPath);
    });
});

describe(`filePathFromCommitPath in case of renames`, () => {
    // examples of renames
    //// clients/src/main/java/org/apache/kafka/clients/admin/{DecommissionBrokerOptions.java => UnregisterBrokerOptions.java}
    //// storage/src/main/java/org/apache/kafka/{server/log/internals => storage/internals/log}/EpochEntry.java
    //// metadata/src/test/java/org/apache/kafka/controller/ControllerPurgatoryTest.java => server-common/src/test/java/org/apache/kafka/deferred/DeferredEventQueueTest.java
    //// {metadata/src/main/java/org/apache/kafka/controller => server-common/src/main/java/org/apache/kafka/deferred}/DeferredEvent.java
    it(`returns the file path for a commit path that DOES represent a rename of just the file name`, () => {
        const commitPath =
            'clients/src/main/java/org/apache/kafka/clients/admin/{DecommissionBrokerOptions.java => UnregisterBrokerOptions.java}';
        const expectedPath = 'clients/src/main/java/org/apache/kafka/clients/admin/UnregisterBrokerOptions.java';
        const path = filePathFromCommitPath(commitPath);
        expect(path).equal(expectedPath);
    });
    it(`returns the file path for a commit path that DOES represent a rename of a subfolder`, () => {
        const commitPath =
            'storage/src/main/java/org/apache/kafka/{server/log/internals => storage/internals/log}/EpochEntry.java';
        const expectedPath = 'storage/src/main/java/org/apache/kafka/storage/internals/log/EpochEntry.java';
        const path = filePathFromCommitPath(commitPath);
        expect(path).equal(expectedPath);
    });
    it(`returns the file path for a commit path that DOES represent a rename of the entire path starting from the root`, () => {
        const commitPath =
            'metadata/src/test/java/org/apache/kafka/controller/ControllerPurgatoryTest.java => server-common/src/test/java/org/apache/kafka/deferred/DeferredEventQueueTest.java';
        const expectedPath = 'server-common/src/test/java/org/apache/kafka/deferred/DeferredEventQueueTest.java';
        const path = filePathFromCommitPath(commitPath);
        expect(path).equal(expectedPath);
    });
    it(`returns the file path for a commit path that DOES represent a rename of the first part of the path`, () => {
        const commitPath =
            '{metadata/src/main/java/org/apache/kafka/controller => server-common/src/main/java/org/apache/kafka/deferred}/DeferredEvent.java';
        const expectedPath = 'server-common/src/main/java/org/apache/kafka/deferred/DeferredEvent.java';
        const path = filePathFromCommitPath(commitPath);
        expect(path).equal(expectedPath);
    });
    it(`returns the file path for a commit path that DOES represent a rename with removal of a part of the path`, () => {
        const commitPath =
            'clients/src/main/java/org/apache/kafka/clients/{consumer/internals => }/StaleMetadataException.java';
        const expectedPath = 'clients/src/main/java/org/apache/kafka/clients/StaleMetadataException.java';
        const path = filePathFromCommitPath(commitPath);
        expect(path).equal(expectedPath);
    });
    it(`returns the file path for a commit path that DOES represent a rename with introduction of a part of the path`, () => {
        const commitPath = 'clients/src/main/java/{ => org/apache}/kafka/common/record/InvalidRecordException.java';
        const expectedPath = 'clients/src/main/java/org/apache/kafka/common/record/InvalidRecordException.java';
        const path = filePathFromCommitPath(commitPath);
        expect(path).equal(expectedPath);
    });
});
