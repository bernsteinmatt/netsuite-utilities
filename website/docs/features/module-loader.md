---
sidebar_position: 7
---

# Module Loader

Load NetSuite SuiteScript modules into the browser console for testing and debugging.

**Keyboard shortcut:** `Ctrl/Cmd + Shift + M`

## How It Works

1. Press the keyboard shortcut on any NetSuite page
2. Modules are loaded into the browser console automatically
3. Access modules via `window.N` or individual module names

When loaded, you'll see a console message:
```
NetSuite modules loaded: N
Available: window.N.record, window.N.search, window.N.query, ...
```

## Available Modules

The following modules become available:

| Module | Global Access | Description |
|--------|---------------|-------------|
| `N/record` | `window.N.record` | Record CRUD operations |
| `N/search` | `window.N.search` | Saved searches and lookups |
| `N/query` | `window.N.query` | SuiteQL query API |
| `N/runtime` | `window.N.runtime` | Script/user runtime info |
| `N/url` | `window.N.url` | URL generation |
| `N/format` | `window.N.format` | Data formatting |
| `N/email` | `window.N.email` | Send emails |
| `N/currentRecord` | `window.N.currentRecord` | Access current page record |

## Console Access

After loading, access modules in the browser console:

```javascript
// Access via window.N
const rec = window.N.record.load({ type: 'salesorder', id: 12345 });

// Or use shorthand if you assign to a variable
const { record, search, query } = window.N;
```

## Use Cases

### Debug Record Operations

Inspect record data and test field access:

```javascript
// Load a record and inspect fields
const rec = window.N.record.load({ type: 'salesorder', id: 12345 });
console.log(rec.getValue('entity'));
console.log(rec.getValue('total'));

// Get all field IDs
console.log(rec.getFields());
```

### Run SuiteQL Queries

Test queries before adding them to scripts:

```javascript
// Run a SuiteQL query
const results = window.N.query.runSuiteQL({
  query: `SELECT id, companyname FROM customer WHERE isinactive = 'F' FETCH FIRST 10 ROWS ONLY`
}).asMappedResults();

console.table(results);
```

### Explore Module APIs

Interactively explore what's available:

```javascript
// See all methods on a module
console.log(Object.keys(window.N.search));

// Check runtime context
console.log(window.N.runtime.getCurrentUser());
```

### Prototype SuiteScript Code

Write and test code snippets before incorporating them into your scripts. This is especially useful for:
- Testing search filters
- Validating record field access
- Debugging transformation logic

## Limitations

- Modules are loaded in the context of the current page
- Some operations may require specific permissions
- Heavy operations may impact page performance
- Not all module features work identically to server-side scripts
