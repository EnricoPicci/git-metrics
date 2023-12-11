"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckoutError = exports.FetchError = exports.PullError = void 0;
class GitError {
    constructor(error, repoPath) {
        this.repoPath = '';
        this.error = error;
        this.repoPath = repoPath;
    }
}
class PullError extends GitError {
    constructor(error, repoPath) {
        super(error, repoPath);
    }
}
exports.PullError = PullError;
class FetchError extends GitError {
    constructor(error, repoPath) {
        super(error, repoPath);
    }
}
exports.FetchError = FetchError;
class CheckoutError extends GitError {
    constructor(error, repoPath) {
        super(error, repoPath);
    }
}
exports.CheckoutError = CheckoutError;
//# sourceMappingURL=repo.errors.js.map