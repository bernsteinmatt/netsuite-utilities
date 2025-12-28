export const containerPrefix = "netsuite-utilities";
export const LOCAL_QUERIES_KEY = "sqlEditorQueries";

// Display mode settings for tools (dialog vs side panel)
export const DISPLAY_MODE_SETTINGS_KEY = "displayModeSettings";

export type DisplayMode = "dialog" | "side-panel";

export interface DisplayModeSettings {
    "sql-editor": DisplayMode;
    "script-log-viewer": DisplayMode;
}

export const DEFAULT_DISPLAY_MODE_SETTINGS: DisplayModeSettings = {
    "sql-editor": "dialog",
    "script-log-viewer": "dialog",
};

// Keyboard shortcut definitions for tools
export const TOOL_SHORTCUTS = {
    "sql-editor": { key: "U", modifiers: ["⌘", "⇧"] },
    "script-log-viewer": { key: "L", modifiers: ["⌘", "⇧"] },
    "command-search": { key: "K", modifiers: ["⌘", "⇧"] },
    "load-modules": { key: "M", modifiers: ["⌘", "⇧"] },
    "record-detail": { key: "E", modifiers: ["⌘", "⇧"] },
} as const;

export type ToolType = "sql-editor" | "script-log-viewer" | "load-modules" | "record-detail";

