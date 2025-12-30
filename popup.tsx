


import "~style.css";



import { ThemeSelector } from "@/components/theme-selector";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { ArrowLeft, Database, FileCode2, Package, ScrollText, Search, Settings } from "lucide-react";
import { useState } from "react";



import { isSidePanelOpen, openSidePanel } from "~lib/chrome-utils";
import { ThemeProvider } from "~lib/contexts/theme-context";
import { useDisplayMode } from "~lib/hooks/use-display-mode";
import { useStorageBoolean } from "~lib/hooks/use-storage-boolean";





const PopupContent = () => {
    const [view, setView] = useState<"main" | "settings">("main");
    const [suiteQLEditorEnabled, setSuiteQLEditorEnabled] = useStorageBoolean({
        key: "feature_suiteqleditor",
        defaultValue: true,
    });

    const [netsuiteShortcutEnabled, setNetsuiteShortcutEnabled] = useStorageBoolean({
        key: "feature_netsuite_shortcut",
        defaultValue: false,
    });

    const [hideGuidedLearningEnabled, setHideGuidedLearningEnabled] = useStorageBoolean({
        key: "feature_hide_guided_learning",
        defaultValue: false,
    });

    const [hideHeaderBackgroundEnabled, setHideHeaderBackgroundEnabled] = useStorageBoolean({
        key: "feature_hide_header_background",
        defaultValue: false,
    });

    const [loadConsoleModulesEnabled, setLoadConsoleModulesEnabled] = useStorageBoolean({
        key: "feature_load_console_modules",
        defaultValue: true,
    });

    const [roleSearchEnabled, setRoleSearchEnabled] = useStorageBoolean({
        key: "feature_role_search",
        defaultValue: true,
    });

    const [showAccountIdsEnabled, setShowAccountIdsEnabled] = useStorageBoolean({
        key: "feature_show_account_ids",
        defaultValue: true,
    });

    const [scriptLogViewerEnabled, setScriptLogViewerEnabled] = useStorageBoolean({
        key: "feature_script_log_viewer",
        defaultValue: true,
    });

    const [recordDetailEnabled, setRecordDetailEnabled] = useStorageBoolean({
        key: "feature_record_detail",
        defaultValue: true,
    });

    const [commandSearchEnabled, setCommandSearchEnabled] = useStorageBoolean({
        key: "feature_command_search",
        defaultValue: true,
    });

    const { displayMode: sqlEditorDisplayMode } = useDisplayMode("sql-editor");
    const { displayMode: scriptLogViewerDisplayMode } = useDisplayMode("script-log-viewer");

    const handleOpenSqlEditor = async () => {
        // Open in side panel if preference is side-panel OR if side panel is already open
        const shouldUseSidePanel =
            sqlEditorDisplayMode === "side-panel" || (await isSidePanelOpen());
        if (shouldUseSidePanel) {
            openSidePanel("sql-editor");
            window.close();
        } else {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                const tab = tabs[0];
                chrome.tabs.sendMessage(tab.id, { action: "OPEN_SQL_EDITOR" });
                window.close();
            });
        }
    };

    const handleLoadConsoleModules = () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const tab = tabs[0];
            chrome.tabs.sendMessage(tab.id, { action: "LOAD_CONSOLE_MODULES" });
            window.close();
        });
    };

    const handleOpenScriptLogViewer = async () => {
        // Open in side panel if preference is side-panel OR if side panel is already open
        const shouldUseSidePanel =
            scriptLogViewerDisplayMode === "side-panel" || (await isSidePanelOpen());
        if (shouldUseSidePanel) {
            openSidePanel("script-log-viewer");
            window.close();
        } else {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                const tab = tabs[0];
                chrome.tabs.sendMessage(tab.id, { action: "OPEN_SCRIPT_LOG_VIEWER" });
                window.close();
            });
        }
    };

    const handleOpenCommandSearch = () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const tab = tabs[0];
            chrome.tabs.sendMessage(tab.id, { action: "OPEN_COMMAND_SEARCH" });
            window.close();
        });
    };

    const handleOpenRecordDetail = () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const tab = tabs[0];
            chrome.tabs.sendMessage(tab.id, { action: "OPEN_RECORD_DETAIL" });
            window.close();
        });
    };

    const hoverClass = "plasmo:hover:bg-primary plasmo:hover:text-primary-foreground";

    const mainItemClassName = cn(
        hoverClass,
        "plasmo:flex plasmo:w-full plasmo:cursor-pointer plasmo:items-center plasmo:gap-2 plasmo:rounded-lg plasmo:px-4 plasmo:py-2 plasmo:transition-colors"
    );
    const featureItemClassName = cn(
        "plasmo:flex plasmo:w-full plasmo:items-center plasmo:gap-2 plasmo:px-4 plasmo:py-2 plasmo:justify-between"
    );

    const Main = () => {
        return (
            <>
                <div className="plasmo:flex plasmo:flex-col plasmo:justify-between plasmo:gap-1 plasmo:bg-card plasmo:p-2">
                    <div
                        className={
                            "plasmo:flex plasmo:items-center plasmo:gap-2"
                        }
                    >
                        <h1 className="plasmo-text-base-content plasmo:text-lg plasmo:font-semibold">
                            NetSuite Utilities
                        </h1>
                        <ThemeSelector />
                        <div className={"plasmo:flex plasmo:flex-row plasmo:justify-end plasmo:flex-1"}>
                            <a
                                href="https://buymeacoffee.com/matthewbernstein"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <img
                                    src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png"
                                    alt="Buy Me A Coffee"
                                    style={{ height: "22px", width: "auto" }}
                                />
                            </a>
                        </div>
                    </div>
                </div>
                <div className="plasmo:flex plasmo:flex-col plasmo:gap-2 plasmo:p-2">
                    <button onClick={() => setView("settings")} className={mainItemClassName}>
                        <Settings size={18} />
                        <span>Enable Features</span>
                    </button>
                    {suiteQLEditorEnabled && (
                        <button onClick={handleOpenSqlEditor} className={mainItemClassName}>
                            <Database size={18} />
                            <span>SuiteQL Editor</span>
                        </button>
                    )}
                    {scriptLogViewerEnabled && (
                        <button onClick={handleOpenScriptLogViewer} className={mainItemClassName}>
                            <ScrollText size={18} />
                            <span>Script Log Viewer</span>
                        </button>
                    )}
                    {commandSearchEnabled && (
                        <button onClick={handleOpenCommandSearch} className={mainItemClassName}>
                            <Search size={18} />
                            <span>Command Search</span>
                        </button>
                    )}
                    {recordDetailEnabled && (
                        <button onClick={handleOpenRecordDetail} className={mainItemClassName}>
                            <FileCode2 size={18} />
                            <span>View Record Detail</span>
                        </button>
                    )}
                    {loadConsoleModulesEnabled && (
                        <button onClick={handleLoadConsoleModules} className={mainItemClassName}>
                            <Package size={18} />
                            <span>Load SuiteScript Modules</span>
                        </button>
                    )}
                </div>
            </>
        );
    };

    const featureSections = [
        {
            title: "Tools",
            features: [
                {
                    label: "Command Search",
                    value: commandSearchEnabled,
                    setValue: setCommandSearchEnabled,
                },
                {
                    label: "SuiteQL Editor",
                    value: suiteQLEditorEnabled,
                    setValue: setSuiteQLEditorEnabled,
                },
                {
                    label: "Script Log Viewer",
                    value: scriptLogViewerEnabled,
                    setValue: setScriptLogViewerEnabled,
                },
                {
                    label: "Record Detail JSON",
                    value: recordDetailEnabled,
                    setValue: setRecordDetailEnabled,
                },
                {
                    label: "Load SuiteScript Modules",
                    value: loadConsoleModulesEnabled,
                    setValue: setLoadConsoleModulesEnabled,
                },
            ],
        },
        {
            title: "Navigation",
            features: [
                {
                    label: "Role Search",
                    value: roleSearchEnabled,
                    setValue: setRoleSearchEnabled,
                },
                {
                    label: "Show Role Account IDs",
                    value: showAccountIdsEnabled,
                    setValue: setShowAccountIdsEnabled,
                },
                {
                    label: "Global Search Keyboard Shortcut",
                    value: netsuiteShortcutEnabled,
                    setValue: setNetsuiteShortcutEnabled,
                },
            ],
        },
        {
            title: "Display",
            features: [
                {
                    label: "Hide Guided Learning",
                    value: hideGuidedLearningEnabled,
                    setValue: setHideGuidedLearningEnabled,
                },
                {
                    label: "Hide Header Background",
                    value: hideHeaderBackgroundEnabled,
                    setValue: setHideHeaderBackgroundEnabled,
                },
            ],
        },
    ];

    const EnableFeatures = () => {
        return (
            <div className={"plasmo:pb-4"}>
                <h1 className="plasmo-text-base-content plasmo-bg-background plasmo:flex plasmo:items-center plasmo:py-2 plasmo:px-4 plasmo:text-lg plasmo:font-semibold plasmo:flex-row plasmo:gap-4">
                    <button onClick={() => setView("main")}>
                        <ArrowLeft size={18} className="cursor-pointer" />
                    </button>
                    <span className="ml-2">Features</span>
                </h1>
                <div className="plasmo:flex plasmo:flex-col plasmo:gap-2 plasmo:pt-2">
                    {featureSections.map((section) => (
                        <div key={section.title}>
                            <h2 className="plasmo:px-4 plasmo:py-1 plasmo:text-xs plasmo:font-semibold plasmo:uppercase plasmo:text-muted-foreground">
                                {section.title}
                            </h2>
                            <div>
                                {section.features.map((feature) => (
                                    <label key={feature.label} className={featureItemClassName}>
                                        <span>{feature.label}</span>
                                        <Switch
                                            checked={feature.value}
                                            onCheckedChange={(newValue) =>
                                                feature.setValue(newValue)
                                            }
                                        />
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const mapping = {
        main: Main,
        settings: EnableFeatures,
    };

    const RenderView = mapping[view];

    if (RenderView) {
        return <RenderView />;
    }
    return <div>Invalid View</div>;
};

function IndexPopup() {
    return (
        <ThemeProvider>
            <div className="plasmo:flex plasmo:items-center plasmo:justify-center plasmo:bg-background plasmo:text-foreground">
                <div className="plasmo-bg-background plasmo-text-base-content plasmo:flex plasmo:w-76 plasmo:flex-col">
                    <PopupContent />
                </div>
            </div>
        </ThemeProvider>
    );
}

export default IndexPopup;
