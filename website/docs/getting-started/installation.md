---
sidebar_position: 1
---

# Installation

## Chrome Web Store

The easiest way to install NetSuite Utilities:

1. Visit the [Chrome Web Store](https://chromewebstore.google.com/detail/netsuite-utilities/bcpikialpbpnlcglbniknbedfkcglppa)
2. Click **Add to Chrome**
3. Navigate to any NetSuite page to start using the extension

## From Source

If you want to build from source or contribute to development:

1. **Clone the repository:**

   ```bash
   git clone https://github.com/bernsteinmatt/netsuite-utilities.git
   cd netsuite-utilities
   ```

2. **Install dependencies:**

   ```bash
   pnpm install
   ```

3. **Build the extension:**

   ```bash
   pnpm build
   ```

4. **Load in Chrome:**

   - Go to `chrome://extensions`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `build/chrome-mv3-prod` folder

## Development Setup

For development with hot reload:

```bash
pnpm dev
```

Load the development build from `build/chrome-mv3-dev`.

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server with hot reload |
| `pnpm build` | Create production build |
| `pnpm package` | Package extension for distribution |
| `pnpm lint` | Run ESLint |
| `pnpm lint:fix` | Run ESLint with auto-fix |
| `pnpm format` | Format code with Prettier |
| `pnpm typecheck` | Run TypeScript type checking |
