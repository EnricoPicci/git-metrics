/* eslint-disable no-undef */
module.exports = {
    parser: '@typescript-eslint/parser',  // Specifies the ESLint parser
    plugins: ["deprecation", '@typescript-eslint'],
    extends: [
        // 'plugin:@typescript-eslint/recommended',
        "eslint:recommended",
        "plugin:@typescript-eslint/eslint-recommended",
        "plugin:@typescript-eslint/recommended",
        "prettier",
        // 'prettier/@typescript-eslint',  // Uses eslint-config-prettier to disable ESLint rules from @typescript-eslint/eslint-plugin that would conflict with prettier
        //  'plugin:prettier/recommended',  // Enables eslint-plugin-prettier and displays prettier errors as ESLint errors. Make sure this is always the last configuration in the extends array.
    ],
    parserOptions: {
        ecmaVersion: 2018,  // Allows for the parsing of modern ECMAScript features
        sourceType: 'module',  // Allows for the use of imports
        // https://stackoverflow.com/a/65063702/5699993
        project: ["./tsconfig.json", "./tsconfig.eslint.json"]
    },
    rules: {
        "deprecation/deprecation": "warn", // or "error" to have stricter rule

        // Place to specify ESLint rules. Can be used to overwrite rules specified from the extended configs

        // List of FixMe rules
        "@typescript-eslint/no-use-before-define": "off",
        "@typescript-eslint/no-object-literal-type-assertion": "off",
        "@typescript-eslint/explicit-function-return-type": "off",
        "@typescript-eslint/explicit-module-boundary-types": "off"
    },
};

// eslint-disable-next-line no-undef
// module.exports = {
//     root: true,
//     parser: '@typescript-eslint/parser',
//     plugins: [
//         '@typescript-eslint',
//     ],
//     extends: [
//         'eslint:recommended',
//         'plugin:@typescript-eslint/recommended',
//     ],
// };