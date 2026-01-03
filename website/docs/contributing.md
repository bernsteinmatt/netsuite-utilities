---
sidebar_position: 100
---

# Contributing

Contributions are welcome! Here's how you can help improve NetSuite Utilities.

## Getting Started

1. **Fork the repository**

   Click the "Fork" button on [GitHub](https://github.com/bernsteinmatt/netsuite-utilities)

2. **Clone your fork**

   ```bash
   git clone https://github.com/YOUR_USERNAME/netsuite-utilities.git
   cd netsuite-utilities
   ```

3. **Install dependencies**

   ```bash
   pnpm install
   ```

4. **Create a feature branch**

   ```bash
   git checkout -b feature/amazing-feature
   ```

5. **Start the development server**

   ```bash
   pnpm dev
   ```

## Development Workflow

### Code Quality

Before committing, ensure your code passes all checks:

```bash
pnpm lint        # Check for linting errors
pnpm typecheck   # Check TypeScript types
pnpm format      # Format code with Prettier
```

### Project Structure

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

### Tech Stack

- **Framework**: [Plasmo](https://plasmo.com/) with React 19 and TypeScript
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI, Lucide icons
- **Data Grid**: AG Grid Community
- **Code Editor**: CodeMirror 6
- **Virtual Scrolling**: TanStack Virtual

## Submitting Changes

1. **Commit your changes**

   ```bash
   git commit -m 'Add some amazing feature'
   ```

2. **Push to your branch**

   ```bash
   git push origin feature/amazing-feature
   ```

3. **Open a Pull Request**

   Go to the [repository](https://github.com/bernsteinmatt/netsuite-utilities) and click "New Pull Request"

## Reporting Issues

Found a bug or have a feature request? [Open an issue](https://github.com/bernsteinmatt/netsuite-utilities/issues) on GitHub.

When reporting bugs, please include:
- Browser and version
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.
