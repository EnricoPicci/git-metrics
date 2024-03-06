export class GitError {
    constructor(message: any, repoPath: string, command: string) {
        this.message = message;
        this.repoPath = repoPath;
        this.command = command;
    }
    message: any;
    repoPath: string = '';
    command: string = '';
}

export class PullError extends GitError {
    constructor(message: any, repoPath: string, command: string) {
        super(message, repoPath, command);
    }
}

export class FetchError extends GitError {
    constructor(message: any, repoPath: string, command: string) {
        super(message, repoPath, command);
    }
}

export class CheckoutError extends GitError {
    constructor(message: any, repoPath: string, command: string, sha: string) {
        super(message, repoPath, command);
        this.sha = sha;
    }
    sha: string
}
