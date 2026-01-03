---
sidebar_position: 4
---

# Record Detail (JSON Viewer)

View any NetSuite record as structured JSON. Press `Ctrl/Cmd + Shift + E` while on a record page.

## Features

### Dual Data Sources

Switch between two modes to view record data:

| Mode | Description |
|------|-------------|
| **XML Mode** | Uses NetSuite's native XML export for complete field visibility including sublists |
| **SuiteQL Mode** | Queries the record directly via SuiteQL with related table support |

XML mode provides complete sublist data, while SuiteQL mode allows you to see related records and additional context.

### Collapsible Tree View

Navigate through body fields and line items with expand/collapse controls:
- Click any node to expand or collapse
- Nested objects and arrays are fully navigable
- Large records are easy to browse

### Search & Filter

Filter fields by name or value:
- Type in the search box to filter
- Matching fields are highlighted
- Non-matching fields are hidden

### Show/Hide Empty Fields

Toggle visibility of null or empty values to focus on populated fields.

### Copy to Clipboard

Copy the entire record as formatted JSON for use in other applications or documentation.

### Records Catalog Link

Quick link to the record type documentation in NetSuite's Records Catalog for field reference.

### Expand/Collapse All

Quickly expand or collapse all nodes in the tree view.

## Usage

1. Navigate to any NetSuite record page (view or edit mode)
2. Press `Ctrl/Cmd + Shift + E`
3. Browse the record data in the JSON viewer
4. Use the toolbar to switch modes, search, or copy data

---

## SuiteQL Mode Details

SuiteQL mode provides richer data by querying records directly and fetching related tables. This section explains how it works and what to expect.

### How Record Type Detection Works

When you open Record Detail, the extension determines what record you're viewing through multiple methods:

1. **URL Pattern Matching** — The URL is checked against known NetSuite URL patterns (fastest method)
2. **CurrentRecord Module** — Falls back to NetSuite's `N/currentRecord` module via a message bridge
3. **XML Parsing** — As a last resort, fetches and parses the XML export

### URL to SuiteQL Table Mapping

NetSuite URLs don't always match SuiteQL table names. The extension handles several cases:

| URL Pattern | SuiteQL Table | Notes |
|-------------|---------------|-------|
| `/app/common/entity/entity.nl` | Varies | Uses `rectype` parameter to determine actual table |
| `/app/accounting/transactions/transaction.nl` | `transaction` | Standard transaction URL |
| `/app/common/custom/custrecordentry.nl` | Dynamic lookup | Queries `customRecordType` to find table name |
| `/setup/role.nl` | `role` | Direct mapping |

**Custom Records**: For custom record pages, the extension queries the `customRecordType` table using the `rectype` URL parameter to find the actual SuiteQL table name (e.g., `customrecord_myrecord`).

### ID Column Differences

Different record types use different ID column names in SuiteQL:

| Column | Used By |
|--------|---------|
| `id` | Most record types (transactions, entities, items) |
| `internalid` | Setup records (roles, departments, locations, subsidiaries) |

The extension automatically uses the correct column based on the URL pattern.

### Related Tables

SuiteQL mode automatically fetches related records based on the record type. Related data appears in the JSON tree with an underscore prefix (e.g., `_transactionline`).

**Examples of related tables:**

| Record Type | Related Tables |
|-------------|----------------|
| **Transactions** | `transactionline`, `transactionaccountingline` |
| **Roles** | `rolepermissions` |
| **Custom Record Types** | `customfield` (field definitions) |
| **Entities** | Varies by entity type |

### Adding Custom Related Tables

The extension includes predefined relationships for common record types. Related tables are configured with:

- **Table name** — The SuiteQL table to query
- **Foreign key** — Column from the primary record used for matching
- **Match column** — Column in the related table to match against
- **Multiple** — Whether to expect multiple related records (array) or a single record

For transactions, this means you'll see all line items and accounting lines automatically included in the JSON output.

### Limitations

- **Not all record types supported** — SuiteQL doesn't expose all NetSuite record types. Use XML mode for unsupported types.
- **Custom record detection** — Requires the `N/currentRecord` module to be available on the page, or falls back to XML parsing.
- **Permission-based** — Results are filtered by your role's permissions.

### When to Use Each Mode

| Use Case | Recommended Mode |
|----------|------------------|
| Complete sublist data | XML |
| Related records (lines, permissions) | SuiteQL |
| Custom record field values | Either (both supported) |
| Debugging SuiteQL queries | SuiteQL (to see available columns) |
| Export for documentation | Either (both support JSON copy) |

---

## Troubleshooting

### "Could not determine table name"

The extension couldn't map the current page to a SuiteQL table. Try:
- Switch to XML mode
- Check if you're on a supported record type

### "Not on a record page"

The extension detected you're not viewing a record. Record Detail only works on:
- Record view pages (`/app/.../entity.nl?id=123`)
- Record edit pages
- Custom record pages

### Empty or missing fields

Some fields may not appear in SuiteQL results due to:
- Field-level security restrictions
- The field not being queryable via SuiteQL
- Toggle "Show Empty" to see all available columns
