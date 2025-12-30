import { useEffect, useRef, useState } from "react";

import { CommandSearch } from "~components/command-search/command-search";
import { RecordDetail } from "~components/record-detail/record-detail";
import { ScriptLogViewer } from "~components/script-log-viewer/script-log-viewer";
import { SqlEditor } from "~components/sql-editor/sql-editor";
import { isSidePanelOpen, openSidePanel } from "~lib/chrome-utils";
import { TOOL_SHORTCUTS, type ToolType } from "~lib/constants";
import { ThemeProvider } from "~lib/contexts/theme-context";
import { useDisplayMode } from "~lib/hooks/use-display-mode";
import { useStorageBoolean } from "~lib/hooks/use-storage-boolean";
import { handleProxyFetch, type ProxyFetchRequest } from "~lib/proxy-fetch";

export type ActiveView =
    | "none"
    | "sql-editor"
    | "script-log-viewer"
    | "command-search"
    | "record-detail";

export type RenderMode = "content" | "sidepanel";

interface NetsuiteUtilitiesProps {
    mode: RenderMode;
    /** For sidepanel mode: initial view to display */
    initialView?: ActiveView;
    /** For content mode: callback when styles need to be injected */
    onStylesNeeded?: (needed: boolean) => void;
}

export const NetsuiteUtilities = ({
    mode,
    initialView = "none",
    onStylesNeeded,
}: NetsuiteUtilitiesProps) => {
    const [activeView, setActiveViewState] = useState<ActiveView>(initialView);

    // Display mode settings (only relevant for content mode)
    const { displayMode: sqlEditorDisplayMode } = useDisplayMode("sql-editor");
    const { displayMode: scriptLogViewerDisplayMode } = useDisplayMode("script-log-viewer");

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
        // Notify parent about style needs (for content mode)
        onStylesNeeded?.(newView !== "none");
        setActiveViewState(newView);
    };

    // Keyboard shortcuts (only in content mode)
    useEffect(() => {
        if (mode !== "content") return;

        const handleKeyDown = async (e: KeyboardEvent) => {
            // All tool shortcuts require Cmd/Ctrl + Shift
            if (!(e.metaKey || e.ctrlKey) || !e.shiftKey) return;

            const key = e.key.toUpperCase();

            // Check if this tool should open in side panel (either by preference or if panel is already open)
            const shouldOpenInSidePanel = async (tool: "sql-editor" | "script-log-viewer") => {
                // If the tool's preference is side panel, use that
                if (tool === "sql-editor" && sqlEditorDisplayMode === "side-panel") return true;
                if (tool === "script-log-viewer" && scriptLogViewerDisplayMode === "side-panel")
                    return true;
                // If side panel is already open, use it regardless of preference
                return await isSidePanelOpen();
            };

            // Check each tool shortcut (only if the tool is enabled)
            if (key === TOOL_SHORTCUTS["command-search"].key && commandSearchEnabled) {
                e.preventDefault();
                setActiveView("command-search");
            } else if (key === TOOL_SHORTCUTS["sql-editor"].key && suiteQLEditorEnabled) {
                e.preventDefault();
                if (await shouldOpenInSidePanel("sql-editor")) {
                    openSidePanel("sql-editor");
                } else {
                    setActiveView("sql-editor");
                }
            } else if (key === TOOL_SHORTCUTS["script-log-viewer"].key && scriptLogViewerEnabled) {
                e.preventDefault();
                if (await shouldOpenInSidePanel("script-log-viewer")) {
                    openSidePanel("script-log-viewer");
                } else {
                    setActiveView("script-log-viewer");
                }
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
        mode,
        commandSearchEnabled,
        suiteQLEditorEnabled,
        scriptLogViewerEnabled,
        loadConsoleModulesEnabled,
        recordDetailEnabled,
        sqlEditorDisplayMode,
        scriptLogViewerDisplayMode,
    ]);

    // Chrome message listener (for content mode)
    useEffect(() => {
        if (mode !== "content") return;

        if (!(window as any).__netsuiteUtilitiesListenerAdded) {
            (window as any).__netsuiteUtilitiesListenerAdded = true;
            chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
                if (message.action === "OPEN_SQL_EDITOR") {
                    setActiveView("sql-editor");
                } else if (message.action === "OPEN_SCRIPT_LOG_VIEWER") {
                    setActiveView("script-log-viewer");
                } else if (message.action === "OPEN_COMMAND_SEARCH") {
                    setActiveView("command-search");
                } else if (message.action === "OPEN_RECORD_DETAIL") {
                    setActiveView("record-detail");
                } else if (message.action === "LOAD_CONSOLE_MODULES") {
                    window.dispatchEvent(new CustomEvent("LOAD_NS_MODULES"));
                    sendResponse({ success: true });
                } else if (message.action === "PROXY_FETCH") {
                    handleProxyFetch(message.payload as ProxyFetchRequest).then(sendResponse);
                    return true; // Keep channel open for async response
                }
            });
        }
    }, [mode]);

    // Chrome message listener (for sidepanel mode - to switch views)
    useEffect(() => {
        if (mode !== "sidepanel") return;

        const handleMessage = (message: { action: string; view?: ActiveView }) => {
            if (message.action === "SIDEPANEL_SET_VIEW" && message.view) {
                setActiveViewState(message.view);
            }
        };

        chrome.runtime.onMessage.addListener(handleMessage);
        return () => chrome.runtime.onMessage.removeListener(handleMessage);
    }, [mode]);

    const containerRef = useRef<HTMLDivElement>(null);

    // Create a portal container div for popovers (content mode only)
    useEffect(() => {
        if (mode !== "content" || !containerRef.current) return;

        const portalDiv = document.createElement("div");
        portalDiv.id = "radix-portal-container";
        portalDiv.style.position = "fixed";
        portalDiv.style.top = "0";
        portalDiv.style.left = "0";
        portalDiv.style.zIndex = "10001";
        portalDiv.style.pointerEvents = "none";
        portalDiv.style.width = "100vw";
        portalDiv.style.height = "100vh";

        containerRef.current.appendChild(portalDiv);

        return () => {
            if (portalDiv.parentNode) {
                portalDiv.parentNode.removeChild(portalDiv);
            }
        };
    }, [mode]);

    const handleClose = () => {
        if (mode === "sidepanel") {
            // In sidepanel mode, just reset to none (or could close the panel)
            setActiveView("none");
        } else {
            setActiveView("none");
        }
    };

    // Side panel mode rendering
    if (mode === "sidepanel") {
        if (activeView === "none") {
            return (
                <ThemeProvider>
                    <div className="plasmo:bg-background plasmo:text-foreground plasmo:h-screen plasmo:flex plasmo:flex-col plasmo:items-center plasmo:justify-center plasmo:p-4">
                        <h2 className="plasmo:text-lg plasmo:font-bold plasmo:mb-2">
                            NetSuite Utilities
                        </h2>
                        <p className="plasmo:text-muted-foreground plasmo:text-sm plasmo:text-center">
                            Use the keyboard shortcuts or toolbar buttons to open a tool in this
                            panel.
                        </p>
                    </div>
                </ThemeProvider>
            );
        }

        return (
            <ThemeProvider>
                <div className="plasmo:h-screen plasmo:w-full">
                    {activeView === "sql-editor" && (
                        <SqlEditor setIsOpen={(open) => !open && handleClose()} isSidePanel />
                    )}
                    {activeView === "script-log-viewer" && (
                        <ScriptLogViewer setIsOpen={(open) => !open && handleClose()} isSidePanel />
                    )}
                </div>
            </ThemeProvider>
        );
    }

    // Content mode rendering
    if (activeView === "none") {
        return null;
    }

    // Dialog/modal layout for content mode
    return (
        <ThemeProvider>
            <div
                className="plasmo:absolute plasmo:w-screen plasmo:h-screen plasmo:bg-black/30 plasmo:z-1001 plasmo:top-0 plasmo:left-0 plasmo:flex plasmo:items-center plasmo:justify-center"
                ref={containerRef}
            >
                {activeView === "sql-editor" && (
                    <div style={{ height: "calc(100vh - 2vh)", width: "calc(100vw - 2vw)" }}>
                        <SqlEditor setIsOpen={(open) => !open && handleClose()} />
                    </div>
                )}
                {activeView === "script-log-viewer" && (
                    <div style={{ height: "calc(100vh - 2vh)", width: "calc(100vw - 2vw)" }}>
                        <ScriptLogViewer setIsOpen={(open) => !open && handleClose()} />
                    </div>
                )}
                {activeView === "record-detail" && (
                    <RecordDetail setIsOpen={(open) => !open && handleClose()} />
                )}
                {activeView === "command-search" && (
                    <CommandSearch
                        setIsOpen={(open) => !open && handleClose()}
                        onOpenTool={async (tool: ToolType) => {
                            if (tool === "load-modules") {
                                window.dispatchEvent(new CustomEvent("LOAD_NS_MODULES"));
                                handleClose();
                                return;
                            }

                            // For sql-editor and script-log-viewer, check if side panel should be used
                            if (tool === "sql-editor" || tool === "script-log-viewer") {
                                // Check preference or if side panel is already open
                                const shouldUseSidePanel =
                                    (tool === "sql-editor" &&
                                        sqlEditorDisplayMode === "side-panel") ||
                                    (tool === "script-log-viewer" &&
                                        scriptLogViewerDisplayMode === "side-panel") ||
                                    (await isSidePanelOpen());

                                if (shouldUseSidePanel) {
                                    handleClose();
                                    openSidePanel(tool);
                                    return;
                                }
                            }

                            setActiveView(tool);
                        }}
                    />
                )}
            </div>
        </ThemeProvider>
    );
};
