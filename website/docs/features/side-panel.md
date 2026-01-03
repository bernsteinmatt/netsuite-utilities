---
sidebar_position: 5
---

# Side Panel Mode

The SuiteQL Editor and Script Log Viewer can be opened in Chrome's side panel, allowing you to keep tools visible while navigating NetSuite pages.

## Benefits

- **Keep tools visible** while navigating NetSuite pages
- **Switch between tools** using keyboard shortcuts
- **Sync queries and schema** between dialog and side panel modes
- **State persistence** — queries, tabs, and filters are shared between modes

## How to Use

### Opening the Side Panel

1. Open a tool via keyboard shortcut (e.g., `Ctrl/Cmd + Shift + U` for SuiteQL Editor)
2. Click the **Panel icon** in the toolbar
3. The tool moves to Chrome's side panel

### Smart Mode Switching

Once the side panel is open, the extension remembers your preference:
- Subsequent keyboard shortcuts open tools **in the side panel** automatically
- Click the Panel icon again to return to dialog mode
- Your preference is saved per tool

### Switching Tools in Side Panel

When the side panel is open with one tool:
- Press `Ctrl/Cmd + Shift + U` to switch to SuiteQL Editor
- Press `Ctrl/Cmd + Shift + L` to switch to Script Log Viewer

The side panel stays open and switches content.

## Supported Tools

| Tool | Side Panel Support |
|------|-------------------|
| SuiteQL Editor | ✓ Yes |
| Script Log Viewer | ✓ Yes |
| Command Search | ✗ Overlay only |
| Record Detail | ✗ Dialog only |

## Keyboard Behavior

In side panel mode, `Escape` does **not** close the panel. This prevents accidental closure while you're working. Use the panel's close button or the Panel icon to exit.

## Data Synchronization

All data syncs between dialog and side panel modes:

| Data | Synced? |
|------|---------|
| Query tabs & content | ✓ |
| Schema cache | ✓ |
| Theme preference | ✓ |
| Log viewer filters | ✓ |
| Expand/collapse state | ✓ |

## Workflow Tips

### Debugging Scripts

1. Open Script Log Viewer in the side panel
2. Navigate to your script deployment
3. Run the script and watch logs appear in real-time
4. Filter by ERROR type to quickly spot issues
5. Expand entries to see full details without leaving the page

### Writing Queries

1. Open SuiteQL Editor in the side panel
2. Browse NetSuite records for context
3. Write and test queries without switching windows
4. Use Record Detail (`Ctrl/Cmd + Shift + E`) to inspect record structures
5. Copy results directly into other applications
