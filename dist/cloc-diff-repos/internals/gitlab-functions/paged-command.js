"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.nextPage = exports.runPagedCommand = void 0;
const axios_1 = __importDefault(require("axios"));
const rxjs_1 = require("rxjs");
function runPagedCommand(command, token) {
    const items = [];
    let totPages;
    const firstPagedCall = firstCall(command, token);
    return (0, rxjs_1.from)(firstPagedCall).pipe((0, rxjs_1.map)(resp => {
        const itemsPaged = resp.data;
        items.push(...itemsPaged);
        totPages = resp.headers['x-total-pages'];
        console.log(`>>>>> read page ${1} of ${totPages} (total pages) - Items read: ${items.length}`);
        const _nextPage = nextPage(parseInt(totPages));
        return { items, _nextPage };
    }), (0, rxjs_1.expand)(({ items, _nextPage }) => {
        const page = _nextPage();
        if (page === -1) {
            console.log(`>>>>> Reading of items completed`);
            return rxjs_1.EMPTY;
        }
        return (0, rxjs_1.from)(nextCall(command, token, page)).pipe((0, rxjs_1.map)(resp => {
            const itemsPaged = resp.data;
            items.push(...itemsPaged);
            console.log(`>>>>> read page ${page} of ${totPages} (total pages) - Items read: ${items.length}`);
            return { items, _nextPage };
        }));
    }), (0, rxjs_1.last)(), (0, rxjs_1.map)(({ items }) => items));
}
exports.runPagedCommand = runPagedCommand;
function firstCall(command, token) {
    const firstPageCommand = pagedCommand(command, 1);
    return remoteCall(firstPageCommand, token);
}
function nextCall(command, token, page) {
    const nextPageCommand = pagedCommand(command, page);
    return remoteCall(nextPageCommand, token);
}
function remoteCall(command, token) {
    return axios_1.default.get(command, {
        headers: {
            "PRIVATE-TOKEN": token
        }
    });
}
function pagedCommand(command, page) {
    return `${command}&page=${page}`;
}
function nextPage(totPages) {
    let page = 1;
    return () => {
        if (page === totPages) {
            return -1;
        }
        page++;
        return page;
    };
}
exports.nextPage = nextPage;
//# sourceMappingURL=paged-command.js.map