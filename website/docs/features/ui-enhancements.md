---
sidebar_position: 6
---

# UI Enhancements

NetSuite Utilities includes several UI enhancements to improve your NetSuite experience. All enhancements can be toggled in the extension popup.

## Display Enhancements

### Hide Guided Learning Tooltips

Remove the guided learning tooltips (the blue coaching marks) that appear throughout NetSuite's interface. Disabled by default.

### Hide Header Background

Remove the header background image for a cleaner look. Also adjusts header padding for a more compact appearance. Disabled by default.

### Dark/Light Theme Selector

Toggle between dark and light themes for the extension's UI components (SuiteQL Editor, Script Log Viewer, etc.). The theme toggle appears in each tool's toolbar.

## Global Search Keyboard Shortcut

**Disabled by default** — When enabled, press `Ctrl/Cmd + K` to instantly focus NetSuite's global search box.

A visual indicator appears next to the search box showing the keyboard shortcut. On macOS, it shows `⌘`, and on Windows/Linux it shows `Ctrl`.

:::note
This shortcut is disabled by default because it may conflict with Command Search (`Ctrl/Cmd + Shift + K`). Enable it in settings if you prefer quick access to NetSuite's native search.
:::

## Role & Account Features

### Role Search

A searchable dropdown injected into the role selection menu:
- Quickly find roles by name or account ID
- Case-insensitive filtering
- Filter through long role lists instantly
- Searches both role names AND account identifiers

**How to use:**
1. Click the role selector in NetSuite's header
2. Type in the search box that appears at the top
3. Results filter in real-time

### Account IDs

Display account IDs in multiple locations:

**Role Selection Menu:**
- Account IDs appear inline next to each role name
- Useful when you have the same role across multiple accounts

**"My Roles" Page:**
- Account IDs are displayed in each row
- A search box lets you filter accounts
- Rows reposition dynamically when filtering (no gaps)

This feature is enabled by default and helps when managing access across multiple NetSuite accounts.

## Configuration

All UI enhancements can be toggled in the extension popup:

| Enhancement | Default | Category |
|-------------|---------|----------|
| Role Search | Enabled | Navigation |
| Show Account IDs | Enabled | Navigation |
| Global Search Shortcut | Disabled | Navigation |
| Hide Guided Learning | Disabled | Display |
| Hide Header Background | Disabled | Display |
