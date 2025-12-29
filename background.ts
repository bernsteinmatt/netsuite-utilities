// Background script for handling side panel operations

// Track which tabs have the side panel open
const sidePanelOpenTabs = new Set<number>();

// Ensure the popup opens on action click, not the side panel
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false });

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "OPEN_SIDEPANEL") {
        const view = message.view || "none";

        // Store the desired view before opening the panel
        chrome.storage.local.set({ sidepanelView: view });

        const openPanel = (tabId: number) => {
            chrome.sidePanel
                .open({ tabId })
                .then(() => {
                    sidePanelOpenTabs.add(tabId);
                    // Also send a message to switch views if the panel is already open
                    // This is safe to send even if the panel just opened (it will just set the view)
                    chrome.runtime.sendMessage({ action: "SIDEPANEL_SET_VIEW", view });
                    sendResponse({ success: true });
                })
                .catch((error) => {
                    console.error("Failed to open side panel:", error);
                    sendResponse({ success: false, error: error.message });
                });
        };

        // Open the side panel for the current tab
        if (sender.tab?.id) {
            openPanel(sender.tab.id);
        } else {
            // If no tab context, get the current active tab
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                const tabId = tabs[0]?.id;
                if (tabId) {
                    openPanel(tabId);
                } else {
                    sendResponse({ success: false, error: "No active tab found" });
                }
            });
        }

        return true; // Keep message channel open for async response
    }

    // Check if side panel is open for the current tab
    if (message.action === "IS_SIDEPANEL_OPEN") {
        // Use lastFocusedWindow for consistency with sidepanel tracking
        chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
            const activeTabId = tabs[0]?.id;
            const isOpen = activeTabId ? sidePanelOpenTabs.has(activeTabId) : false;
            sendResponse({ isOpen });
        });
        return true; // Keep channel open for async response
    }

    // Side panel notifies when it's opened/closed
    if (message.action === "SIDEPANEL_OPENED") {
        const tabId = message.tabId;
        if (tabId) {
            sidePanelOpenTabs.add(tabId);
        }
    }

    if (message.action === "SIDEPANEL_CLOSED") {
        const tabId = message.tabId;
        if (tabId) {
            sidePanelOpenTabs.delete(tabId);
        }
    }
});

// Clean up when tabs are closed
chrome.tabs.onRemoved.addListener((tabId) => {
    sidePanelOpenTabs.delete(tabId);
});

export {};
