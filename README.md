# NetSuite Utilities

A browser extension that supercharges your NetSuite workflow. Run SuiteQL queries, browse script logs, search roles instantly, and customize the interface—all without leaving your browser.

Built with [Plasmo](https://docs.plasmo.com/), React, and TypeScript.

## Features

### Command Search

A powerful command palette for quickly navigating NetSuite. Press `Ctrl/Cmd + Shift + K` to open.

- **Universal search** - Search across customers, vendors, employees, transactions, scripts, custom records, and more
- **Smart prefixes** - Use prefixes like `cus:`, `ven:`, `emp:`, `tran:`, `script:`, `cr:` (custom records), `cl:` (custom lists) to filter results
- **Navigation search** - Search NetSuite menu items with `nav:` prefix
- **Quick access to tools** - Launch SuiteQL Editor, Script Log Viewer, Record Detail, and Module Loader directly from the command palette
- **Custom record instance search** - Search within custom record data based on your permissions
- **Autosuggest integration** - Leverages NetSuite's native search for additional results

### Record Detail (JSON Viewer)

View any NetSuite record as structured JSON. Press `Ctrl/Cmd + Shift + E` while on a record page.

- **Collapsible tree view** - Navigate through body fields and line items with expand/collapse controls
- **Search & filter** - Filter fields by name or value with highlighted matches
- **Copy to clipboard** - Copy the entire record or individual sections as JSON
- **Records Catalog link** - Quick link to the record type documentation in NetSuite's Records Catalog
- **Expand/Collapse all** - Quickly expand or collapse all nodes

### SuiteQL Editor

A full-featured SQL editor for executing SuiteQL queries directly against NetSuite:

- **CodeMirror-powered editor** with syntax highlighting and autocomplete
- **Multi-tab query management** with persistent storage (synced across dialog and side panel)
- **Multiple result formats**: Table view (AG Grid), JSON, and CSV export
- **Schema caching** - fetch and cache NetSuite record catalog for autocomplete
- **Query formatting** with sql-formatter
- **Side Panel support** - open in Chrome's side panel for persistent access while browsing

**Keyboard shortcut:** `Ctrl/Cmd + Shift + U`

### Script Log Viewer

Browse and filter SuiteScript execution logs with advanced filtering:

- Filter by log type, script ID, title, and detail text
- Date range filtering
- Virtual scrolling for large datasets
- Expandable log entries
- **Side Panel support** - open in Chrome's side panel for persistent access while browsing

**Keyboard shortcut:** `Ctrl/Cmd + Shift + L`

### Side Panel Mode

The SuiteQL Editor and Script Log Viewer can be opened in Chrome's side panel, allowing you to:

- **Keep tools visible** while navigating NetSuite pages
- **Switch between tools** using keyboard shortcuts - if the side panel is open, new tools open there automatically
- **Sync queries and schema** between dialog and side panel modes
- **Configure display mode** per tool in the extension settings

To use side panel mode:
1. Open a tool via keyboard shortcut or the extension popup
2. Click the side panel icon in the toolbar to switch modes
3. Once the side panel is open, subsequent tool shortcuts will open in the panel

### SuiteScript Module Loader

Load NetSuite modules into the browser console for testing and debugging.

**Keyboard shortcut:** `Ctrl/Cmd + Shift + M`

### Role & Account Search

- **Role Search** - Searchable dropdown in the role selection menu
- **Account IDs** - Display account IDs inline on the "My Roles" page with search

### UI Enhancements

- Hide guided learning tooltips
- Hide header background
- Global search keyboard shortcut
- Dark/Light theme selector

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + Shift + K` | Open Command Search |
| `Ctrl/Cmd + Shift + U` | Open SuiteQL Editor |
| `Ctrl/Cmd + Shift + L` | Open Script Log Viewer |
| `Ctrl/Cmd + Shift + E` | Open Record Detail (JSON) |
| `Ctrl/Cmd + Shift + M` | Load NetSuite Modules |

## Installation

### From Source

1. Clone the repository:
   ```bash
   git clone https://github.com/bernsteinmatt/netsuite-utilities.git
   cd netsuite-utilities
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Build the extension:
   ```bash
   pnpm build
   ```

4. Load in your browser:
   - **Chrome**: Go to `chrome://extensions`, enable "Developer mode", click "Load unpacked", and select `build/chrome-mv3-prod`
   - **Firefox**: Go to `about:debugging`, click "This Firefox", click "Load Temporary Add-on", and select any file in `build/firefox-mv3-prod`

### Development

Run the development server with hot reload:

```bash
pnpm dev
```

Load the development build from `build/chrome-mv3-dev` (Chrome) or `build/firefox-mv3-dev` (Firefox).

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server with hot reload |
| `pnpm build` | Create production build |
| `pnpm package` | Package extension for distribution |
| `pnpm lint` | Run ESLint |
| `pnpm lint:fix` | Run ESLint with auto-fix |
| `pnpm format` | Format code with Prettier |
| `pnpm typecheck` | Run TypeScript type checking |

## Tech Stack

- **Framework**: [Plasmo](https://plasmo.com/) with React 19 and TypeScript
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI, Lucide icons
- **Data Grid**: AG Grid Community
- **Code Editor**: CodeMirror 6
- **Virtual Scrolling**: TanStack Virtual

## Project Structure

```
├── components/          # React components
│   ├── sql-editor/     # SuiteQL editor components
│   ├── script-log-viewer/  # Log viewer components
│   ├── record-detail/  # Record JSON viewer components
│   ├── command-search/ # Command palette components
│   └── ui/             # Reusable UI components
├── contents/           # Content scripts injected into pages
├── lib/                # Utilities, hooks, and contexts
├── popup.tsx           # Extension popup
├── sidepanel.tsx       # Chrome side panel
└── background.ts       # Service worker script
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source. See the LICENSE file for details.

## Acknowledgments

- [Plasmo](https://plasmo.com/) for the excellent browser extension framework
- [NetSuite](https://www.netsuite.com/) for the platform this extension enhances
