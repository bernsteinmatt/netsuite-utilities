---
sidebar_position: 2
---

# SuiteQL Editor

A full-featured SQL editor for executing SuiteQL queries directly against NetSuite.

**Keyboard shortcut:** `Ctrl/Cmd + Shift + U`

## Features

### CodeMirror-Powered Editor

- Syntax highlighting for SQL
- Autocomplete for table and field names (requires schema cache)
- Line numbers and error indicators
- Dark and light theme support

### Multi-Tab Query Management

- Create multiple query tabs with the **+** button
- Up to 20 tabs persist across sessions
- Each tab maintains its own query and results
- Tabs sync between dialog and side panel modes
- Auto-generated tab names ("Query 1", "Query 2", etc.)

### Execute Selected Text

If you select a portion of your query before running, only the selected text executes. This is useful for testing parts of complex queries without commenting out code.

### Result Formats

View query results in multiple formats using the dropdown:

| Format | Description |
|--------|-------------|
| **Table** | Interactive AG Grid with sorting, filtering, and column resizing |
| **JSON** | Raw JSON output for programmatic use |
| **CSV** | Comma-separated format for spreadsheet export |

### Schema Caching

Enable autocomplete by caching your NetSuite schema:

1. Click the **?** (Help) menu in the toolbar
2. Select **Cache Schema**
3. Wait for the progress indicator to complete

Once cached, the editor provides autocomplete suggestions for table and field names as you type. Use **Clear Schema Cache** to refresh if tables have changed.

### Query Formatting

Format your SQL queries with `Ctrl/Cmd + Shift + F` or the format button. The formatter applies:
- 4-space indentation
- Uppercase keywords and functions
- Consistent line breaks

### Toolbar Reference

| Icon | Action |
|------|--------|
| **▶** | Run query (or selected text) |
| **Format** | Format SQL |
| **Table/JSON/CSV** | Switch result format |
| **☀/🌙** | Toggle light/dark theme |
| **Panel** | Switch to side panel mode |
| **?** | Help menu (schema caching, documentation links) |

### Help Menu Links

The **?** menu provides quick access to:
- **Records Catalog** — NetSuite's official table/field documentation (account-specific)
- **Built-in Functions** — Oracle SQL function reference

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + Enter` | Run query (or selected text) |
| `Ctrl/Cmd + Shift + F` | Format query |
| `Escape` | Close editor (dialog mode only) |

## Side Panel Mode

Open the SuiteQL Editor in Chrome's side panel for persistent access while browsing NetSuite:

1. Open the editor using `Ctrl/Cmd + Shift + U`
2. Click the side panel icon in the toolbar
3. Continue browsing NetSuite while keeping your queries visible

Queries and schema are synchronized between dialog and side panel modes. In side panel mode, `Escape` does not close the editor.

## Example Queries

**List active customers:**

```sql
SELECT id, companyname, email
FROM customer
WHERE isinactive = 'F'
ORDER BY companyname
FETCH FIRST 100 ROWS ONLY
```

**Find recent transactions:**

```sql
SELECT
    transaction.id,
    transaction.tranid,
    transaction.type,
    COALESCE(BUILTIN.DF(transactionLine.entity), BUILTIN.DF(transaction.entity)) AS entity,
    transaction.trandate,
    transactionLine.foreignAmount
FROM
    transaction
    INNER JOIN transactionLine ON transaction.id = transactionLine.transaction
WHERE
    trandate >= ADD_MONTHS(SYSDATE, -1)
ORDER BY
    trandate DESC
FETCH NEXT 50 ROWS ONLY
```

**Search scripts by name:**

```sql
SELECT id, name, scripttype, scriptfile
FROM script
WHERE LOWER(name) LIKE '%scheduled%'
```
