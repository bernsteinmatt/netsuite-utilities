/** @type {import('prettier').Config} */
const prettierConfig = {
    plugins: ["@ianvs/prettier-plugin-sort-imports", "prettier-plugin-tailwindcss"],
};

const sortImportConfig = {
    importOrder: [
        "<BUILTIN_MODULES>", // Node.js built-in modules
        "<THIRD_PARTY_MODULES>", // Imports not matched by other special words or groups.
        "", // Empty line
        "^@plasmo/(.*)$",
        "",
        "^@plasmohq/(.*)$",
        "",
        "^~(.*)$",
        "",
        "^[./]",
    ],
};

const config = {
    ...prettierConfig,
    ...sortImportConfig,
    trailingComma: "es5",
    tabWidth: 4,
    semi: true,
    singleQuote: false,
    printWidth: 100,
    bracketSpacing: true,
    arrowParens: "always",
    bracketSameLine: false,
    importOrderSeparation: true,
};

export default config;
