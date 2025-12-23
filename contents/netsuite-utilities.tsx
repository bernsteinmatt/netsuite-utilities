import { ScriptLogViewer } from "@/components/script-log-viewer/script-log-viewer";
import { SqlEditor } from "@/components/sql-editor/sql-editor";
import { useStorageBoolean } from "@/lib/hooks/use-storage-boolean";
import cssText from "data-text:@/style.css";
import type { PlasmoCSConfig, PlasmoGetRootContainer } from "plasmo";
import { useEffect, useRef, useState } from "react";

import { CommandSearch } from "~components/command-search/command-search";
import { RecordDetail } from "~components/record-detail/record-detail";
import { TOOL_SHORTCUTS, type ToolType } from "~lib/constants";
import { ThemeProvider } from "~lib/contexts/theme-context";

export const config: PlasmoCSConfig = {
    matches: [
        "*://*.netsuite.com/*",
        // "http://localhost:5173/*",
    ],
};

type ActiveView = "none" | "sql-editor" | "script-log-viewer" | "command-search" | "record-detail";

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

    // Feature enabled states
    const [commandSearchEnabled] = useStorageBoolean({
        key: "feature_command_search",
        defaultValue: true,
    });
    const [suiteQLEditorEnabled] = useStorageBoolean({
        key: "feature_suiteqleditor",
        defaultValue: true,
    });
    const [scriptLogViewerEnabled] = useStorageBoolean({
        key: "feature_script_log_viewer",
        defaultValue: true,
    });
    const [loadConsoleModulesEnabled] = useStorageBoolean({
        key: "feature_load_console_modules",
        defaultValue: true,
    });
    const [recordDetailEnabled] = useStorageBoolean({
        key: "feature_record_detail",
        defaultValue: true,
    });

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

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // All tool shortcuts require Cmd/Ctrl + Shift
            if (!(e.metaKey || e.ctrlKey) || !e.shiftKey) return;

            const key = e.key.toUpperCase();

            // Check each tool shortcut (only if the tool is enabled)
            if (key === TOOL_SHORTCUTS["command-search"].key && commandSearchEnabled) {
                e.preventDefault();
                setActiveView("command-search");
            } else if (key === TOOL_SHORTCUTS["sql-editor"].key && suiteQLEditorEnabled) {
                e.preventDefault();
                setActiveView("sql-editor");
            } else if (key === TOOL_SHORTCUTS["script-log-viewer"].key && scriptLogViewerEnabled) {
                e.preventDefault();
                setActiveView("script-log-viewer");
            } else if (key === TOOL_SHORTCUTS["load-modules"].key && loadConsoleModulesEnabled) {
                e.preventDefault();
                window.dispatchEvent(new CustomEvent("LOAD_NS_MODULES"));
            } else if (key === TOOL_SHORTCUTS["record-detail"].key && recordDetailEnabled) {
                e.preventDefault();
                setActiveView("record-detail");
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [
        commandSearchEnabled,
        suiteQLEditorEnabled,
        scriptLogViewerEnabled,
        loadConsoleModulesEnabled,
    ]);

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
                if (message.action === "OPEN_COMMAND_SEARCH") {
                    setActiveView("command-search");
                }
                if (message.action === "OPEN_RECORD_DETAIL") {
                    setActiveView("record-detail");
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

    const containerRef = useRef<HTMLDivElement>(null);
    // Create a portal container div for popovers
    useEffect(() => {
        if (containerRef.current) {
            // Create a div inside our component to serve as the portal container
            const portalDiv = document.createElement("div");
            portalDiv.id = "radix-portal-container";
            portalDiv.style.position = "fixed";
            portalDiv.style.top = "0";
            portalDiv.style.left = "0";
            portalDiv.style.zIndex = "10001";
            portalDiv.style.pointerEvents = "none";
            portalDiv.style.width = "100vw";
            portalDiv.style.height = "100vh";

            // Append to our container
            containerRef.current.appendChild(portalDiv);

            return () => {
                if (portalDiv.parentNode) {
                    portalDiv.parentNode.removeChild(portalDiv);
                }
            };
        }
    }, []);
    if (activeView === "none") {
        return null;
    }

    return (
        <ThemeProvider>
            <div
                className={
                    "plasmo:absolute plasmo:w-screen plasmo:h-screen plasmo:bg-black/30 plasmo:z-1000 plasmo:top-0 plasmo:left-0 plasmo:flex plasmo:items-center plasmo:justify-center"
                }
                ref={containerRef}
            >
                {activeView === "sql-editor" && (
                    <SqlEditor setIsOpen={(open) => !open && handleClose()} />
                )}
                {activeView === "script-log-viewer" && (
                    <ScriptLogViewer setIsOpen={(open) => !open && handleClose()} />
                )}
                {activeView === "record-detail" && (
                    <RecordDetail setIsOpen={(open) => !open && handleClose()} />
                )}
                {activeView === "command-search" && (
                    <CommandSearch
                        setIsOpen={(open) => !open && handleClose()}
                        onOpenTool={(tool: ToolType) => {
                            if (tool === "load-modules") {
                                window.dispatchEvent(new CustomEvent("LOAD_NS_MODULES"));
                                handleClose();
                            } else {
                                setActiveView(tool);
                            }
                        }}
                    />
                )}
            </div>
        </ThemeProvider>
    );
};

export default NetsuiteUtilities;
