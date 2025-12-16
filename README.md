# NetSuite Utilities

A browser extension that supercharges your NetSuite workflow. Run SuiteQL queries, browse script logs, search roles instantly, and customize the interface—all without leaving your browser.

Built with [Plasmo](https://docs.plasmo.com/), React, and TypeScript.

## Features

### SuiteQL Editor

A full-featured SQL editor for executing SuiteQL queries directly against NetSuite:

- **CodeMirror-powered editor** with syntax highlighting and autocomplete
- **Multi-tab query management** with persistent storage
- **Multiple result formats**: Table view (AG Grid), JSON, and CSV export
- **Schema caching** - fetch and cache NetSuite record catalog for reference
- **Query formatting** with sql-formatter

**Keyboard shortcuts:**
- `Ctrl/Cmd + Shift + Enter` - Run query
- `Ctrl/Cmd + Shift + F` - Format SQL
- `Esc` - Close editor

### Script Log Viewer

Browse and filter SuiteScript execution logs with advanced filtering:

- Filter by log type, script ID, title, and detail text
- Date range filtering
- Virtual scrolling for large datasets
- Expandable log entries

**Keyboard shortcuts:**
- `Ctrl/Cmd + Enter` - Refresh logs
- `Esc` - Close viewer

### Role & Account Search

- **Role Search** - Searchable dropdown in the role selection menu
- **Account IDs** - Display account IDs inline on the "My Roles" page with search

### UI Enhancements

- Hide guided learning tooltips
- Hide header background
- Global search keyboard shortcut
- Dark/Light theme selector

### SuiteScript Module Loader

Load NetSuite modules into the browser console for testing and debugging.

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
│   └── ui/             # Reusable UI components
├── contents/           # Content scripts injected into pages
├── lib/                # Utilities, hooks, and contexts
├── popup.tsx           # Extension popup
└── background/         # Service worker scripts
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
