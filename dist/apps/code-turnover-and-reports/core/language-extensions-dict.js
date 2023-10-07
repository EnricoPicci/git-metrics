"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.languageExtensions = void 0;
const fs = __importStar(require("fs"));
const DEFAULT_LANGUAGE_EXTENSIONS_DICT = {
    'TypeScript': ['*.ts', '*.tsx'],
    'Java': ['*.java'],
    'HTML': ['*.html'],
    'JavaScript': ['*.js'],
    'Kotlin': ['*.kt', '*.kts'],
    'Python': ['*.py'],
    'SQL': ['*.sql'],
    'JSON': ['*.json'],
    'XML': ['*.xml'],
    'CSS': ['*.css'],
    'Markdown': ['*.md'],
    'YAML': ['*.yaml'],
    'Shell': ['*.sh'],
    'Ruby': ['*.rb'],
    'Maven': ['*.pom', '*.bom'],
};
function languageExtensions(languages, langExtFile) {
    let extensions = [];
    const extensionsDict = langExtFile ? readExtensionsFile(langExtFile) : DEFAULT_LANGUAGE_EXTENSIONS_DICT;
    return languages.reduce((acc, language) => {
        const oneLanguageExtentions = extensionsDict[language] || [];
        if (oneLanguageExtentions.length === 0) {
            console.warn(`No extensions for language ${language}`);
        }
        acc = [...acc, ...oneLanguageExtentions];
        return acc;
    }, extensions);
}
exports.languageExtensions = languageExtensions;
function readExtensionsFile(langExtFile) {
    let extensions = [];
    // read synchronously the extension file and, if does not exixst, throw an error and exit
    try {
        extensions = fs.readFileSync(langExtFile, 'utf8').split('\n');
    }
    catch (error) {
        console.error(`Could not read file ${langExtFile}`);
        process.exit(1);
    }
    // parse the extention variable to create a JSON object, if fails throw an error and exit
    let extensionsDict;
    try {
        extensionsDict = JSON.parse(extensions.join(''));
    }
    catch (error) {
        console.error(`Could not parse file ${langExtFile}`);
        process.exit(1);
    }
    return extensionsDict;
}
//# sourceMappingURL=language-extensions-dict.js.map