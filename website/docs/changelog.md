---
sidebar_position: 100
title: Changelog
---

# Changelog

All notable changes to NetSuite Utilities will be documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.7] - 2026-03-24

### Added

- **Script Log Viewer**: Copy and download buttons to export all visible logs as plain text
- **Load Current Record**: New popup button to load just `N/currentRecord` into the console as `window.currentRec` without loading all SuiteScript modules

## [0.0.6] - 2026-02-06

### Added

- **REST API Data Source**: New "REST" tab in Record Detail viewer that fetches records via `/services/rest/record/v1/`, including sublist expansion and nested field flattening
- URL-based record type detection from path slugs for broader page compatibility

### Changed

- Improved error handling for NetSuite module loading with RequireJS errback support
- Record Detail data source selector now defaults based on the current page context
- Unified record info display across all data source tabs (XML, REST, SuiteQL)
- Quick Execute button now gracefully handles pages where `N/currentRecord` is unavailable

### Fixed

- NetSuite heading styles (h1-h6) no longer override dialog content styling
- SuiteQL Record Detail now retries with fallback table names when primary table query fails

### Removed

- Unused `date-fns` and `react-day-picker` dependencies
- Moved `prettier` and `prettier-plugin-tailwindcss` to devDependencies

## [0.0.5] - 2026-01-09

### Added

- **Quick Execute Button**: One-click execution for Map/Reduce and Scheduled scripts directly from the script record page
    - Automatically detects script type and only shows for executable scripts (Map/Reduce, Scheduled)
    - Works with both legacy NetSuite theme and Redwood theme
    - Shows "Executing..." feedback while script is being triggered
    - Alerts user if no deployment is available for the script
- **Script Type Quick Links**: Command Search now includes direct links to script lists filtered by type (Scheduled, Suitelet, RESTlet, User Event, Client, Map/Reduce, Portlet, Mass Update, Workflow Action, Bundle Installation, SDF Installation, Custom Tool)
- New `requireNetSuiteModule` utility for loading NetSuite modules outside React components

## [0.0.4] - 2026-01-02

### Added

- SuiteQL components for Record Detail parsing and visualization
- Support links component with GitHub and "Buy Me a Coffee" links
- Empty fields toggle in Record Detail view

### Changed

- Improved Escape key handling in side panel mode for SqlEditor and ScriptLogViewer
- Enhanced Record Detail parsing improvements

## [0.0.3] - 2025-12-XX

### Added

- Side panel support for Chrome
- Record Detail feature with collapsible tree view and search
- Keyboard shortcut for Record Detail (<kbd>Ctrl/Cmd</kbd> + <kbd>Shift</kbd> + <kbd>E</kbd>)

### Changed

- Refactored side panel integration and utility abstraction
- Optimized side panel behavior and schema storage
- Updated z-index values for proper modal layering

## [0.0.2] - 2025-12-XX

### Added

- Permission handling and utility hooks
- UI enhancements across the extension

### Changed

- Refactored NetSuite integration into modular structure
- Improved type safety and removed unnecessary logging

## [0.0.1] - 2025-12-XX

### Added

- Initial release
- **SuiteQL Editor**: Full-featured SQL editor with syntax highlighting, autocomplete, and multi-tab support
- **Command Search**: Quick navigation with smart prefixes for customers, vendors, transactions
- **Script Log Viewer**: Browse and filter SuiteScript logs with virtual scrolling
- **UI Enhancements**: Dark/light themes, role search, account ID display
- Keyboard shortcuts for all major features
