---
sidebar_position: 1
---

# Command Search

A powerful command palette for quickly navigating NetSuite. Press `Ctrl/Cmd + Shift + K` to open.

## Features

### Universal Search

Search across multiple record types simultaneously:
- Customers
- Vendors
- Employees
- Transactions (with entity names)
- Scripts
- Accounts
- Custom records
- Custom lists
- And more

Results appear as you type (after 2+ characters, with 500ms debounce).

### Smart Prefixes

Use prefixes to filter results to specific record types:

| Prefix | Record Type | Notes |
|--------|-------------|-------|
| `cus:` | Customers | |
| `ven:` | Vendors | |
| `emp:` | Employees | |
| `entity:` | All Entities | Customers, vendors, employees, etc. |
| `tran:` | Transactions | Includes entity name via join |
| `acc:` | Accounts | Chart of accounts |
| `script:` | Scripts | |
| `cr:` | Custom Record Types | Record type definitions |
| `cl:` | Custom Lists | |
| `nav:` | Navigation/Menu Items | Also: `menu:`, `navigation:` |

**Example:** Type `cus:acme` to search only customers containing "acme".

### Navigation Search

Use the `nav:` prefix to search NetSuite menu items and navigate directly to pages.

**Example:** `nav:sales order` finds menu items related to sales orders.

### Quick Tool Access

Launch any of the extension's tools directly from the command palette:
- SuiteQL Editor
- Script Log Viewer
- Record Detail
- Module Loader

### Quick Links

At the bottom of search results, find quick links to common record lists:
- Accounts (Chart of Accounts)
- Customers
- Vendors
- Employees
- Scripts
- Custom Records
- Custom Lists

### Custom Record Instance Search

Search within custom record data based on your permissions. The extension queries custom record types you have access to and searches their instances. Results are filtered according to your role's access level.

### NetSuite Autosuggest Integration

Command Search integrates with NetSuite's built-in global search autosuggest feature, which provides results for additional record types beyond what the extension searches directly. This means you get the best of both worlds:

- **Extension search**: Fast, targeted results for common record types with smart prefixes
- **NetSuite autosuggest**: Additional results from NetSuite's native search, including record types configured by your administrator

The autosuggest results appear in a "Quick Search" section alongside extension results, giving you comprehensive search coverage across your NetSuite account. Duplicate results are automatically filtered out.

When many autosuggest results exist, a "See all results" link appears to open NetSuite's full global search.

## Keyboard Navigation

| Key | Action |
|-----|--------|
| `↑` / `↓` | Navigate results |
| `Enter` | Open selected result |
| `Escape` | Close command search |

## Search Behavior

- **Minimum characters**: 2 (after prefix)
- **Debounce**: 500ms delay before searching
- **Result limits**: Up to 15 results per category, 25 autosuggest results
- **Case-insensitive**: All searches ignore case
