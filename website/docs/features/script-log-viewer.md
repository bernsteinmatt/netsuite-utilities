---
sidebar_position: 3
---

# Script Log Viewer

Browse and filter SuiteScript execution logs with advanced filtering capabilities.

**Keyboard shortcut:** `Ctrl/Cmd + Shift + L`

## Features

### Advanced Filtering

Filter logs by multiple criteria:

| Filter | Description |
|--------|-------------|
| **Log Type** | DEBUG, AUDIT, ERROR, EMERGENCY, SYSTEM (multi-select) |
| **Script ID** | Filter by specific script |
| **Title** | Search log entry titles |
| **Detail** | Search within log details |
| **Date Range** | Filter by start and end date |

All filter settings are saved automatically and restored when you reopen the viewer.

### Date Range Defaults

- **From Date** defaults to today at midnight
- **To Date** defaults to the current time
- All times use your local timezone
- Adjust as needed for historical debugging

### Virtual Scrolling

Efficiently handle large datasets with virtual scrolling—only visible rows are rendered, enabling smooth browsing of thousands of log entries.

### Expandable Entries

- Click any log entry to expand and view the full detail text
- Use **Expand All** / **Collapse All** buttons in the toolbar
- Expand/collapse state persists across sessions

### Toolbar Reference

| Icon | Action |
|------|--------|
| **Refresh** | Reload logs with current filters |
| **Remove All** | Clear filters and set From Date to now (useful for watching new logs) |
| **Expand/Collapse All** | Toggle all log entries |
| **☀/🌙** | Toggle light/dark theme |
| **Panel** | Switch to side panel mode |

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Escape` | Close viewer (dialog mode only) |

## Side Panel Mode

Keep the log viewer visible while debugging scripts:

1. Open the viewer using `Ctrl/Cmd + Shift + L`
2. Click the side panel icon to move it to Chrome's side panel
3. Navigate to script deployments, run scripts, and watch logs in real-time

In side panel mode, `Escape` does not close the viewer.

## Tips

- Use the date range filter to focus on recent logs during debugging sessions
- Combine filters (e.g., ERROR type + specific script ID) to quickly find relevant entries
- Select multiple log types to see DEBUG and ERROR logs together
- Filters persist across sessions, so your debugging setup is always ready
