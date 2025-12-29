// Chrome extension utility functions

export type SidePanelView = "sql-editor" | "script-log-viewer" | "none";

/**
 * Check if the side panel is currently open.
 * Uses chrome.runtime.sendMessage to query the background script,
 * which uses the reliable chrome.runtime.getContexts() API.
 */
export const isSidePanelOpen = (): Promise<boolean> => {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: "IS_SIDEPANEL_OPEN" }, (response) => {
            resolve(response?.isOpen ?? false);
        });
    });
};

/**
 * Open the side panel with a specific view.
 * Returns a promise that resolves when the panel is opened.
 */
export const openSidePanel = (view: SidePanelView): Promise<boolean> => {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: "OPEN_SIDEPANEL", view }, (response) => {
            resolve(response?.success ?? false);
        });
    });
};
