


import "@/style.css";



import { useEffect, useState } from "react";



import { Storage } from "@plasmohq/storage";



import { NetsuiteUtilities, type ActiveView } from "~components/netsuite-utilities/netsuite-utilities";





const storage = new Storage();

const Parent = ({ children }) => {
    return (
        <div
            className={
                "plasmo:bg-background plasmo:text-background plasmo:h-screen plasmo:w-screen"
            }
        >
            {children}
        </div>
    );
};


const SidePanel = () => {
    const [initialView, setInitialView] = useState<ActiveView>("none");
    const [viewReady, setViewReady] = useState(false);
    const [themeReady, setThemeReady] = useState(false);
    const [isNetSuitePage, setIsNetSuitePage] = useState<boolean | null>(null);

    // Check if the active tab is a NetSuite page (on mount and when tab URL changes)
    useEffect(() => {
        let currentWindowId: number | null = null;

        const checkActiveTab = () => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                const tab = tabs[0];
                if (tab?.windowId) {
                    currentWindowId = tab.windowId;
                }
                const url = tab?.url || "";
                setIsNetSuitePage(url.includes("netsuite.com"));
            });
        };

        // Check on mount
        checkActiveTab();

        // Listen for tab updates (URL changes, loading complete, etc.)
        const handleTabUpdate = (_tabId: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) => {
            // Only respond to tabs in our window that are active
            if (tab.windowId === currentWindowId && tab.active) {
                // Check on URL change or when loading completes
                if (changeInfo.url || changeInfo.status === "complete") {
                    const url = tab.url || "";
                    setIsNetSuitePage(url.includes("netsuite.com"));
                }
            }
        };

        // Listen for tab activation (switching tabs)
        const handleTabActivated = (activeInfo: chrome.tabs.TabActiveInfo) => {
            // Only respond to tab changes in our window
            if (activeInfo.windowId === currentWindowId) {
                chrome.tabs.get(activeInfo.tabId, (tab) => {
                    const url = tab?.url || "";
                    setIsNetSuitePage(url.includes("netsuite.com"));
                });
            }
        };

        chrome.tabs.onUpdated.addListener(handleTabUpdate);
        chrome.tabs.onActivated.addListener(handleTabActivated);

        return () => {
            chrome.tabs.onUpdated.removeListener(handleTabUpdate);
            chrome.tabs.onActivated.removeListener(handleTabActivated);
        };
    }, []);

    // Read the desired view from storage on mount
    useEffect(() => {
        chrome.storage.local.get("sidepanelView", (result) => {
            const view = result.sidepanelView as ActiveView;
            if (view === "sql-editor" || view === "script-log-viewer") {
                setInitialView(view);
                // Clear the stored view so subsequent opens start fresh
                chrome.storage.local.remove("sidepanelView");
            }
            setViewReady(true);
        });
    }, []);

    // Pre-load theme and apply to document before rendering
    useEffect(() => {
        storage.get("theme-mode").then((theme) => {
            const themeClass = (theme as string) || "dark-grey";
            document.documentElement.classList.add(themeClass);
            // Apply background color to body for proper overscroll behavior in side panel
            document.body.style.backgroundColor = "var(--background)";
            setThemeReady(true);
        });
    }, []);

    if (!viewReady || !themeReady || isNetSuitePage === null) {
        return <Parent>{null}</Parent>;
    }

    if (!isNetSuitePage) {
        return (
            <Parent>
                <div className="plasmo:h-full plasmo:flex plasmo:flex-col plasmo:items-center plasmo:justify-center plasmo:p-4 plasmo:text-foreground">
                    <h2 className="plasmo:text-lg plasmo:font-bold plasmo:mb-2">
                        NetSuite Required
                    </h2>
                    <p className="plasmo:text-muted-foreground plasmo:text-sm plasmo:text-center">
                        Navigate to a NetSuite page to use these tools.
                    </p>
                </div>
            </Parent>
        );
    }

    return (
        <Parent>
            <NetsuiteUtilities mode="sidepanel" initialView={initialView} />
        </Parent>
    );
};

export default SidePanel;
