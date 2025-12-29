// Background script for handling side panel operations

// Ensure the popup opens on action click, not the side panel
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false });

// Check if side panel is currently open using chrome.runtime.getContexts API
const isSidePanelOpen = async (): Promise<boolean> => {
    const contexts = await chrome.runtime.getContexts({
        contextTypes: [chrome.runtime.ContextType.SIDE_PANEL],
    });
    return contexts.length > 0;
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "OPEN_SIDEPANEL") {
        const view = message.view || "none";

        // Store the desired view before opening the panel
        chrome.storage.local.set({ sidepanelView: view });

        const openPanel = (tabId: number) => {
            chrome.sidePanel
                .open({ tabId })
                .then(() => {
                    // Send a message to switch views if the panel is already open
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

    // Check if side panel is open using the reliable getContexts API
    if (message.action === "IS_SIDEPANEL_OPEN") {
        isSidePanelOpen().then((isOpen) => {
            sendResponse({ isOpen });
        });
        return true; // Keep channel open for async response
    }
});

export {};
