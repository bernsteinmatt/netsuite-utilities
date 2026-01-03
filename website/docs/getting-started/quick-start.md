---
sidebar_position: 2
---

# Quick Start

After installing the extension, here's how to get started with the main features.

## Opening Tools

All tools can be opened using keyboard shortcuts or from the extension popup.

| Shortcut | Tool |
|----------|------|
| `Ctrl/Cmd + Shift + K` | Command Search |
| `Ctrl/Cmd + Shift + U` | SuiteQL Editor |
| `Ctrl/Cmd + Shift + L` | Script Log Viewer |
| `Ctrl/Cmd + Shift + E` | Record Detail (JSON) |
| `Ctrl/Cmd + Shift + M` | Module Loader |

## Your First Search

1. Navigate to any NetSuite page
2. Press `Ctrl/Cmd + Shift + K` to open Command Search
3. Start typing to search across customers, vendors, transactions, and more
4. Use prefixes like `cus:` for customers or `ven:` for vendors to filter results
5. Press `Enter` to navigate to the selected result

## Your First Query

1. Press `Ctrl/Cmd + Shift + U` to open the SuiteQL Editor
2. Try a simple query:

   ```sql
   SELECT id, companyname
   FROM customer
   WHERE isinactive = 'F'
   FETCH FIRST 10 ROWS ONLY
   ```

3. Click "Run" or press `Ctrl/Cmd + Enter` to execute
4. View results in table format, or switch to JSON/CSV

## Viewing Record Data

1. Navigate to any NetSuite record (customer, transaction, etc.)
2. Press `Ctrl/Cmd + Shift + E` to open Record Detail
3. Browse the record's data as a collapsible JSON tree
4. Use the search box to filter fields by name or value
5. Toggle between XML and SuiteQL data sources

## Using the Side Panel

Chrome users can keep tools visible while browsing:

1. Open any tool using its keyboard shortcut
2. Click the side panel icon in the toolbar
3. The tool opens in Chrome's side panel
4. Navigate NetSuite normally—the panel stays open
5. Use keyboard shortcuts to switch between tools in the panel
