/**
 * URL Pattern Definitions for SuiteQL Record Detail
 *
 * This file defines how to extract record information from NetSuite URLs
 * and which SuiteQL tables to query.
 *
 * ============================================================================
 * HOW TO ADD A NEW RECORD TYPE
 * ============================================================================
 *
 * 1. Navigate to the record page in NetSuite and copy the URL
 *    Example: https://account.app.netsuite.com/app/setup/role.nl?id=1091
 *
 * 2. Identify the key parts:
 *    - Path pattern: The unique part of the URL path (e.g., "/setup/role.nl")
 *    - ID parameter: Usually "id" in the query string
 *    - Table name: The SuiteQL table to query (e.g., "role")
 *
 * 3. Add a new entry to URL_PATTERNS:
 *    {
 *        pathPattern: "/setup/role.nl",  // Matches using includes()
 *        idParam: "id",                  // URL parameter containing the record ID
 *        idColumn: "id",                 // Column name in WHERE clause (usually "id" or "internalid")
 *        staticTable: "role",            // The SuiteQL table name
 *    }
 *
 * ============================================================================
 * HOW TO ADD RELATED TABLES
 * ============================================================================
 *
 * Related tables are queried after the main record and nested in the results.
 * They appear as collapsible sections prefixed with "_" (e.g., "_rolepermissions").
 *
 * Add a relatedTables array to your pattern:
 *    {
 *        pathPattern: "/setup/role.nl",
 *        idParam: "id",
 *        idColumn: "id",
 *        staticTable: "role",
 *        relatedTables: [
 *            {
 *                table: "rolepermissions",    // Related table to query
 *                foreignKey: "id",            // Column from the main record to use as filter value
 *                matchColumn: "role",         // Column in related table to match against
 *                multiple: true,              // true = array of results, false = single result
 *            },
 *        ],
 *    }
 *
 * The query generated will be:
 *    SELECT * FROM rolepermissions WHERE role = '{main record id}'
 *
 * ============================================================================
 * ADVANCED: DYNAMIC TABLE LOOKUP
 * ============================================================================
 *
 * For records where the table name must be looked up dynamically (e.g., custom records),
 * use lookupTables instead of staticTable:
 *
 *    {
 *        pathPattern: "/custrecordentry.nl",
 *        idParam: "id",
 *        rectypeParam: "rectype",           // URL param containing the record type ID
 *        lookupTables: [
 *            {
 *                lookupTable: "customRecordType",  // Table to query for the table name
 *                tableNameColumn: "scriptid",      // Column containing the actual table name
 *                matchColumn: "internalid",        // Column to match against rectypeParam value
 *            },
 *        ],
 *    }
 *
 * ============================================================================
 * RECORD TYPE TO TABLE MAPPING
 * ============================================================================
 *
 * Some record types from XML/currentRecord have different SuiteQL table names.
 * Add mappings to RECORD_TYPE_TO_TABLE when the XML recordType differs from
 * the SuiteQL table name:
 *
 *    "revRecSchedule": "AmortizationSchedule",
 *    "revRecTemplate": "amortizationtemplate",
 *
 * ============================================================================
 * NOTES
 * ============================================================================
 *
 * - pathPattern uses includes() for matching, so be specific enough to avoid false matches
 * - Order matters: more specific patterns should come before generic ones
 * - The idColumn is usually "id", but some tables use "internalid"
 * - Related table results are prefixed with "_" and sorted alphabetically
 * - If no pattern matches, the system falls back to XML parsing or currentRecord module
 */

/**
 * Table lookup definition for resolving record types to table names
 */
export interface TableLookup {
    /** The table to query to resolve the table name (e.g., customRecordType) */
    lookupTable: string;
    /** The column containing the table name/scriptid to use */
    tableNameColumn: string;
    /** The column to match against the URL param value */
    matchColumn: string;
}

/**
 * Definition for fetching related records and nesting them in the result
 */
export interface RelatedTable {
    /** The related table to query */
    table: string;
    /** Column in the primary record that references the related table */
    foreignKey: string;
    /** Column in the related table to match against */
    matchColumn: string;
    /** Key name for nesting in results (defaults to "_" + table name) */
    nestKey?: string;
    /** If true, return all matching records as an array instead of just the first */
    multiple?: boolean;
}

/**
 * URL pattern definitions for extracting record information from NetSuite URLs.
 * Each pattern defines how to extract record type and ID from specific URL paths.
 */
export interface UrlPatternDefinition {
    /** Path pattern to match (uses includes() check) */
    pathPattern: string;
    /** URL parameter name for the record ID */
    idParam: string;
    /** Column name to use in WHERE clause (defaults to "id") */
    idColumn?: string;
    /** URL parameter name for the record type identifier (if applicable) */
    rectypeParam?: string;
    /** Tables to query to resolve the actual table name from rectypeParam value */
    lookupTables?: TableLookup[];
    /** Static table name to use if record type can be determined directly */
    staticTable?: string;
    /** Related tables to fetch and nest in the result */
    relatedTables?: RelatedTable[];
}

/**
 * Mapping from XML recordType to SuiteQL table name.
 * Used when the XML/currentRecord recordType differs from the actual SuiteQL table name.
 */
export const RECORD_TYPE_TO_TABLE: Record<string, string> = {
    revRecSchedule: "AmortizationSchedule",
    revRecTemplate: "amortizationtemplate",
};

export const URL_PATTERNS: UrlPatternDefinition[] = [
    // Custom record TYPE definition page (not an instance, but the type itself)
    // URL: /app/common/custom/custrecord.nl?id=841 (no rectype param = it's the type definition)
    {
        pathPattern: "/common/custom/custrecord.nl",
        idParam: "id",
        idColumn: "internalid", // customRecordType uses internalid, not id
        staticTable: "customRecordType",
        relatedTables: [
            {
                table: "customfield",
                foreignKey: "internalid",
                matchColumn: "recordtype",
                nestKey: "_customfield",
                multiple: true,
            },
        ],
    },
    // Custom list definition page
    // URL: /app/common/custom/custlist.nl?id=933
    {
        pathPattern: "/common/custom/custlist.nl",
        idParam: "id",
        idColumn: "internalid", // customList uses internalid, not id
        staticTable: "customList",
    },
    // Custom record INSTANCE page
    // URL: /app/common/custom/custrecordentry.nl?rectype=841&id=123
    {
        pathPattern: "/custrecordentry.nl",
        idParam: "id",
        rectypeParam: "rectype",
        lookupTables: [
            {
                lookupTable: "customRecordType",
                tableNameColumn: "scriptid",
                matchColumn: "internalid",
            },
        ],
    },
    // Custom segment definition page
    // URL: /app/common/custom/segments/segment.nl?id=1
    {
        pathPattern: "/custom/segments/segment.nl",
        idParam: "id",
        idColumn: "internalid",
        staticTable: "customsegment",
        relatedTables: [
            {
                table: "customrecordtype",
                foreignKey: "recordtype",
                matchColumn: "internalid",
            },
        ],
    },
    // Custom transaction type definition page
    // URL: /app/common/custom/customtransaction.nl?id=153
    {
        pathPattern: "/custom/customtransaction.nl",
        idParam: "id",
        idColumn: "id",
        staticTable: "customtransactiontype",
    },
    // Custom field definition pages (all *custfield.nl URLs)
    // URL: /app/common/custom/entitycustfield.nl?id=12139
    // URL: /app/common/custom/itemcustfield.nl?id=57
    // URL: /app/common/custom/eventcustfield.nl?id=9295
    // URL: /app/common/custom/bodycustfield.nl?id=220
    // URL: /app/common/custom/columncustfield.nl?id=12153
    // URL: /app/common/custom/itemnumbercustfield.nl?id=51
    {
        pathPattern: "custfield.nl",
        idParam: "id",
        idColumn: "id",
        staticTable: "customfield",
    },
    // Item option (custom item field) definition page
    // URL: /app/common/custom/itemoption.nl?id=13
    {
        pathPattern: "/custom/itemoption.nl",
        idParam: "id",
        idColumn: "id",
        staticTable: "customfield",
    },
    // Sublist definition page
    // URL: /app/common/custom/sublist.nl?id=14
    {
        pathPattern: "/custom/sublist.nl",
        idParam: "id",
        idColumn: "id",
        staticTable: "sublist",
    },
    // Account page
    // URL: /app/accounting/account/account.nl?id=140
    {
        pathPattern: "/accounting/account/account.nl",
        idParam: "id",
        idColumn: "id",
        staticTable: "account",
    },
    // Subsidiary page
    // URL: /app/common/otherlists/subsidiarytype.nl?id=3
    {
        pathPattern: "/otherlists/subsidiarytype.nl",
        idParam: "id",
        idColumn: "id",
        staticTable: "subsidiary",
    },
    // Department page
    // URL: /app/common/otherlists/departmenttype.nl?id=1
    {
        pathPattern: "/otherlists/departmenttype.nl",
        idParam: "id",
        idColumn: "id",
        staticTable: "department",
    },
    // Location page
    // URL: /app/common/otherlists/locationtype.nl?id=2
    {
        pathPattern: "/otherlists/locationtype.nl",
        idParam: "id",
        idColumn: "id",
        staticTable: "location",
    },
    // Classification page
    // URL: /app/common/otherlists/classtype.nl?id=10
    {
        pathPattern: "/otherlists/classtype.nl",
        idParam: "id",
        idColumn: "id",
        staticTable: "classification",
    },
    // System Email Template page
    // URL: /app/crm/common/merge/systememailtemplate.nl?id=23
    {
        pathPattern: "/crm/common/merge/systememailtemplate.nl",
        idParam: "id",
        idColumn: "id",
        staticTable: "systememailtemplate",
    },
    // Campaign Email Address page
    // URL: /app/crm/marketing/campaignemail.nl?id=2
    {
        pathPattern: "/crm/marketing/campaignemail.nl",
        idParam: "id",
        idColumn: "id",
        staticTable: "campaignemailaddress",
    },
    // Online Lead Form page
    // URL: /app/crm/sales/leadform.nl?id=1
    {
        pathPattern: "/crm/sales/leadform.nl",
        idParam: "id",
        idColumn: "id",
        staticTable: "onlineleadform",
    },
    // Support Territory page
    // URL: /app/crm/support/supportterritory.nl?id=4
    {
        pathPattern: "/crm/support/supportterritory.nl",
        idParam: "id",
        idColumn: "id",
        staticTable: "supportterritory",
    },
    // Online Case Form page
    // URL: /app/crm/support/caseform.nl?id=10
    {
        pathPattern: "/crm/support/caseform.nl",
        idParam: "id",
        idColumn: "internalid",
        staticTable: "onlinecaseform",
    },
    // Bin Number page
    // URL: /app/accounting/transactions/inventory/binnumberrecord.nl?id=3
    {
        pathPattern: "/transactions/inventory/binnumberrecord.nl",
        idParam: "id",
        idColumn: "id",
        staticTable: "bin",
    },
    // Item page
    // URL: /app/common/item/item.nl?id=630
    {
        pathPattern: "/common/item/item.nl",
        idParam: "id",
        idColumn: "id",
        staticTable: "item",
    },
    // Amortization Schedule/Template page
    // URL: /app/accounting/otherlists/revrecschedule.nl?type=Amortization&id=4
    // Same URL is used for both types - differentiated by XML recordType:
    //   revRecSchedule -> AmortizationSchedule (id column)
    //   revRecTemplate -> amortizationtemplate (id column)
    // Falls back to XML/currentRecord detection since URL alone can't distinguish
    // Role page
    // URL: /app/setup/role.nl?id=1091
    {
        pathPattern: "/setup/role.nl",
        idParam: "id",
        idColumn: "id",
        staticTable: "role",
        relatedTables: [
            {
                table: "rolepermissions",
                foreignKey: "id",
                matchColumn: "role",
                multiple: true,
            },
        ],
    },
    // Employee Expense Source Type page
    // URL: /app/accounting/transactions/expense/importedemployeeexpense/sourcetype.nl?id=-5
    {
        pathPattern: "/transactions/expense/importedemployeeexpense/sourcetype.nl",
        idParam: "id",
        idColumn: "id",
        staticTable: "employeeexpensesourcetype",
    },
    // All transaction types (vendbill, invoice, salesorder, etc.)
    // URL: /app/accounting/transactions/vendbill.nl?id=65339
    // URL: /app/accounting/transactions/salesord.nl?id=12345
    // URL: /app/accounting/transactions/custinvc.nl?id=67890
    {
        pathPattern: "/transactions/",
        idParam: "id",
        idColumn: "id",
        staticTable: "transaction",
        relatedTables: [
            {
                table: "transactionline",
                foreignKey: "id",
                matchColumn: "transaction",
                multiple: true,
            },
            {
                table: "transactionaccountingline",
                foreignKey: "id",
                matchColumn: "transaction",
                multiple: true,
            },
        ],
    },
];
