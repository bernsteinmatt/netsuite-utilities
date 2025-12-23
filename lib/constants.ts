export const containerPrefix = "netsuite-utilities";
export const LOCAL_QUERIES_KEY = "sqlEditorQueries";

// Keyboard shortcut definitions for tools
export const TOOL_SHORTCUTS = {
    "sql-editor": { key: "U", modifiers: ["⌘", "⇧"] },
    "script-log-viewer": { key: "L", modifiers: ["⌘", "⇧"] },
    "command-search": { key: "K", modifiers: ["⌘", "⇧"] },
    "load-modules": { key: "M", modifiers: ["⌘", "⇧"] },
    "record-detail": { key: "E", modifiers: ["⌘", "⇧"] },
} as const;

export type ToolType = "sql-editor" | "script-log-viewer" | "load-modules" | "record-detail";

