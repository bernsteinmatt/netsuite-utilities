import { ScriptLogViewer } from "@/components/script-log-viewer/script-log-viewer";
import { SqlEditor } from "@/components/sql-editor/sql-editor";
import cssText from "data-text:@/style.css";
import type { PlasmoCSConfig, PlasmoGetRootContainer } from "plasmo";
import { useEffect, useState } from "react";

import { ThemeProvider } from "~lib/contexts/theme-context";

export const config: PlasmoCSConfig = {
    matches: ["*://*.netsuite.com/*"],
};

type ActiveView = "none" | "sql-editor" | "script-log-viewer";

/**
 * Mount the content script directly to the page's DOM instead of using Shadow DOM.
 * This is necessary because react-resizable-panels is not compatible with Shadow DOM.
 */
export const getRootContainer: PlasmoGetRootContainer = () => {
    const container = document.createElement("div");
    container.id = "netsuite-utilities-root";
    document.body.appendChild(container);

    return container;
};

const NetsuiteUtilities = () => {
    const [activeView, setActiveViewState] = useState<ActiveView>("none");

    const setActiveView = (newView: ActiveView) => {
        const styleId = "netsuite-utilities-styles";

        if (newView !== "none") {
            if (!document.getElementById(styleId)) {
                const styleElement = document.createElement("style");
                styleElement.id = styleId;
                styleElement.textContent = cssText;
                document.head.appendChild(styleElement);
            }
        } else {
            // Remove styles when closing to avoid affecting the page
            const existingStyle = document.getElementById(styleId);
            if (existingStyle) {
                existingStyle.remove();
            }
        }
        setActiveViewState(newView);
    };

    const handleClose = () => {
        setActiveView("none");
    };

    useEffect(() => {
        console.log("NetSuite Utilities content script running");

        if (!(window as any).__netsuiteUtilitiesListenerAdded) {
            (window as any).__netsuiteUtilitiesListenerAdded = true;
            chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
                if (message.action === "OPEN_SQL_EDITOR") {
                    setActiveView("sql-editor");
                }
                if (message.action === "OPEN_SCRIPT_LOG_VIEWER") {
                    setActiveView("script-log-viewer");
                }
                if (message.action === "LOAD_CONSOLE_MODULES") {
                    // Dispatch custom event that the main world script will listen for
                    window.dispatchEvent(new CustomEvent("LOAD_NS_MODULES"));
                    sendResponse({ success: true });
                }
                return true;
            });
        }
    }, []);

    if (activeView === "none") {
        return null;
    }

    return (
        <ThemeProvider>
            <div
                className={
                    "plasmo:absolute plasmo:w-screen plasmo:h-screen plasmo:bg-black/30 plasmo:top-0 plasmo:left-0 plasmo:flex plasmo:items-center plasmo:justify-center"
                }
            >
                {activeView === "sql-editor" && (
                    <SqlEditor setIsOpen={(open) => !open && handleClose()} />
                )}
                {activeView === "script-log-viewer" && (
                    <ScriptLogViewer setIsOpen={(open) => !open && handleClose()} />
                )}
            </div>
        </ThemeProvider>
    );
};

export default NetsuiteUtilities;
