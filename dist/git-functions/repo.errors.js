"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckoutError = exports.FetchError = exports.PullError = exports.GitError = void 0;
class GitError {
    constructor(message, repoPath, command) {
        this.repoPath = '';
        this.command = '';
        this.message = message;
        this.repoPath = repoPath;
        this.command = command;
    }
}
exports.GitError = GitError;
class PullError extends GitError {
    constructor(message, repoPath, command) {
        super(message, repoPath, command);
    }
}
exports.PullError = PullError;
class FetchError extends GitError {
    constructor(message, repoPath, command) {
        super(message, repoPath, command);
    }
}
exports.FetchError = FetchError;
class CheckoutError extends GitError {
    constructor(message, repoPath, command, sha) {
        super(message, repoPath, command);
        this.sha = sha;
    }
}
exports.CheckoutError = CheckoutError;
//# sourceMappingURL=repo.errors.js.map