class GitError {
    constructor(error: any, repoPath: string) {
        this.error = error;
        this.repoPath = repoPath;
    }
    error: any;
    repoPath: string = '';
}

export class PullError extends GitError {
    constructor(error: any, repoPath: string) {
        super(error, repoPath);
    }
}

export class FetchError extends GitError {
    constructor(error: any, repoPath: string) {
        super(error, repoPath);
    }
}

export class CheckoutError extends GitError {
    constructor(error: any, repoPath: string) {
        super(error, repoPath);
    }
}
