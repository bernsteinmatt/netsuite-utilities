import { SQLDialect, type SQLConfig } from "@codemirror/lang-sql";

// SuiteQL keywords - SELECT statements only
const SUITEQL_KEYWORDS = [
    // Core SELECT
    "SELECT",
    "FROM",
    "WHERE",
    "AS",
    // Joins
    "JOIN",
    "INNER",
    "LEFT",
    "RIGHT",
    "OUTER",
    "CROSS",
    "ON",
    // Grouping & Ordering
    "GROUP",
    "BY",
    "HAVING",
    "ORDER",
    "ASC",
    "DESC",
    "NULLS",
    "FIRST",
    "LAST",
    // Set operations
    "UNION",
    "ALL",
    "INTERSECT",
    "EXCEPT",
    "MINUS",
    // Filtering
    "DISTINCT",
    "TOP",
    "LIMIT",
    "OFFSET",
    "FETCH",
    "NEXT",
    "ROWS",
    "ONLY",
    // Conditions
    "AND",
    "OR",
    "NOT",
    "IN",
    "EXISTS",
    "BETWEEN",
    "LIKE",
    "ESCAPE",
    "IS",
    "NULL",
    // Case expressions
    "CASE",
    "WHEN",
    "THEN",
    "ELSE",
    "END",
    // Aggregates
    "COUNT",
    "SUM",
    "AVG",
    "MIN",
    "MAX",
    // Subqueries
    "WITH",
    "RECURSIVE",
    // Comparison
    "ANY",
    "SOME",
    // Boolean
    "TRUE",
    "FALSE",
    // Misc
    "OVER",
    "PARTITION",
    "ROWNUM",
].join(" ");

// Create a custom dialect with case-insensitive identifiers (no quoting needed)
const SuiteQLDialect = SQLDialect.define({
    caseInsensitiveIdentifiers: true,
    keywords: SUITEQL_KEYWORDS,
});

// NetSuite SuiteQL Built-in Functions
// https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/article_161950565221.html
const BUILTIN_FUNCTION_NAMES = [
    "CF",
    "CONSOLIDATE",
    "CURRENCY",
    "CURRENCY_CONVERT",
    "DF",
    "HIERARCHY",
    "MNFILTER",
    "NAMED_GROUP",
    "PERIOD",
    "RELATIVE_RANGES",
];

// Build the schema for autocomplete
const buildSchema = (cachedSchema?: Record<string, string[]> | null): Record<string, string[]> => {
    const schema: Record<string, string[]> = {
        BUILTIN: BUILTIN_FUNCTION_NAMES,
    };

    if (cachedSchema) {
        Object.assign(schema, cachedSchema);
    }

    return schema;
};

export const getSuiteqlConfig = (cachedSchema?: Record<string, string[]> | null): SQLConfig => ({
    upperCaseKeywords: true,
    dialect: SuiteQLDialect,
    schema: buildSchema(cachedSchema),
});

// For backwards compatibility - but won't include dynamic schema
export const suiteqlConfig: SQLConfig = {
    upperCaseKeywords: true,
    dialect: SuiteQLDialect,
    schema: {
        BUILTIN: BUILTIN_FUNCTION_NAMES,
    },
};
