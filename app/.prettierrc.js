module.exports = {
    // this line is required for pnpm
    plugins: [require.resolve("@trivago/prettier-plugin-sort-imports")],

    semi: true,
    tabWidth: 4,
    printWidth: 120,
    singleQuote: true,
    trailingComma: "es5",
    bracketSameLine: false,
    endOfLine: "auto",
    overrides: [
        {
            files: "*.yml",
            options: {
                tabWidth: 2,
            },
        },
        {
            files: "*.yaml",
            options: {
                tabWidth: 2,
            },
        },
    ],
    importOrder: [
        "<THIRD_PARTY_MODULES>",
        "^@/(app|assets|constants|lib|types|config|utils)(/.+)?$",
        "^[./]",
    ],
    importOrderSeparation: true,
    importOrderSortSpecifiers: true,
}