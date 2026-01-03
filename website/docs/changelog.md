---
sidebar_position: 100
title: Changelog
---

# Changelog

All notable changes to NetSuite Utilities will be documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
