module.exports = {
    root: true, // Make sure eslint picks up the config at the root of the directory
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 2022, // Use the latest ecmascript standard
        sourceType: 'module', // Allows using import/export statements
    },
    env: {
        browser: true, // Enables browser globals like window and document
        amd: true, // Enables require() and define() as global variables as per the amd spec.
        node: true, // Enables Node.js global variables and Node.js scoping.
    },
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/eslint-recommended',
        'plugin:@typescript-eslint/recommended',
        'prettier',
        'plugin:prettier/recommended', // Make this the last element so prettier config overrides other formatting rules
    ],
    plugins: ['unused-imports'],
    rules: {
        'unused-imports/no-unused-imports': 'error',
        'prettier/prettier': [
            'error',
            {
                endOfLine: 'auto',
            },
            { usePrettierrc: true },
        ],
        '@typescript-eslint/explicit-function-return-type': 2,
        'sort-imports': [
            'error',
            {
                ignoreCase: true,
                ignoreDeclarationSort: true,
                ignoreMemberSort: true,
                memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single'],
                allowSeparatedGroups: true,
            },
        ],
        '@typescript-eslint/ban-ts-comment': 'off',
        '@typescript-eslint/ban-ts-ignore': 'off',
        '@typescript-eslint/ban-types': 'off',
        '@typescript-eslint/triple-slash-reference': 'off',
        'prefer-const': [
            'warn',
            {
                destructuring: 'all',
                ignoreReadBeforeAssign: false,
            },
        ],
        'object-shorthand': 'warn',
        'no-debugger': 'warn',
        'array-callback-return': ['warn', { allowImplicit: true, checkForEach: true }],
        '@typescript-eslint/no-empty-function': 'off',
        '@typescript-eslint/no-unused-vars': [
            'warn',
            { ignoreRestSiblings: true, argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
        ],
        'no-useless-rename': [
            'error',
            {
                ignoreDestructuring: false,
                ignoreImport: false,
                ignoreExport: false,
            },
        ],
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/prefer-as-const': 'off',
    },
};
