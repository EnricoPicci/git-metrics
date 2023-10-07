import * as fs from 'fs'

const DEFAULT_LANGUAGE_EXTENSIONS_DICT: { [language: string]: string[] } = {
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
}

export function languageExtensions(languages: string[], langExtFile?: string): string[] {
    let extensions: string[] = []
    const extensionsDict = langExtFile ? readExtensionsFile(langExtFile) : DEFAULT_LANGUAGE_EXTENSIONS_DICT
    return languages.reduce((acc, language) => {
        const oneLanguageExtentions = extensionsDict[language] || []
        if (oneLanguageExtentions.length === 0) {
            console.warn(`No extensions for language ${language}`)
        }
        acc = [...acc, ...oneLanguageExtentions]
        return acc
    }, extensions)
}

function readExtensionsFile(langExtFile: string) {
    let extensions: string[] = []
    // read synchronously the extension file and, if does not exixst, throw an error and exit
    try {
        extensions = fs.readFileSync(langExtFile, 'utf8').split('\n')
    } catch (error) {
        console.error(`Could not read file ${langExtFile}`)
        process.exit(1)
    }
    // parse the extention variable to create a JSON object, if fails throw an error and exit
    let extensionsDict: { [language: string]: string[] }
    try {
        extensionsDict = JSON.parse(extensions.join(''))
    } catch (error) {
        console.error(`Could not parse file ${langExtFile}`)
        process.exit(1)
    }
    return extensionsDict
}