import { VIEW_TYPES } from "@/components/sql-editor/constants";
import { CopyDropdown } from "@/components/sql-editor/copy-dropdown";
import { DownloadDropdown } from "@/components/sql-editor/download-dropdown";
import { HelpDropdown } from "@/components/sql-editor/help-dropdown";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
// NOTE: react-resizable-panels does not work with Shadow DOM because it attaches pointer event
// listeners to document.body. See content.tsx getRootContainer() for Shadow DOM bypass.
import * as ResizablePanels from "@/node_modules/react-resizable-panels/dist/react-resizable-panels";
import { sql } from "@codemirror/lang-sql";
import { oneDark } from "@codemirror/theme-one-dark";
import CodeMirror, { type ReactCodeMirrorRef } from "@uiw/react-codemirror";
import clsx from "clsx";
import { Database, Moon, PanelRight, Play, Plus, Sun, X } from "lucide-react";
import React, { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { format as sqlFormat } from "sql-formatter";

import { Storage } from "@plasmohq/storage";

import { openSidePanel } from "~lib/chrome-utils";
import { darkGreyTheme, lightTheme } from "~lib/codemirror-themes";
import { LOCAL_QUERIES_KEY } from "~lib/constants";
import { useTheme } from "~lib/contexts/theme-context";
import { useDisplayMode } from "~lib/hooks/use-display-mode";
import { isNetSuite } from "~lib/is-netsuite";
import { mergeReducer } from "~lib/merge-reducer";
import { executeQuery } from "~lib/netsuite";
import { loadSchema, type Schema } from "~lib/netsuite-schema";
import { formatTime } from "~lib/utils";

import { DataContent } from "./data-content";
import { mockData } from "./mock-data";
import { getSuiteqlConfig } from "./suiteql-completions";

const { Panel, PanelGroup, PanelResizeHandle } = ResizablePanels;

// Constants
const MOCK_QUERY_DELAY_MS = 1000;
const DEFAULT_PANEL_MIN_SIZE = 10;
const SQL_FORMATTER_CONFIG = {
    language: "sql" as const,
    tabWidth: 4,
    keywordCase: "upper" as const,
    linesBetweenQueries: 2,
    functionCase: "upper" as const,
    expressionWidth: 100,
};

interface QueryTab {
    id: string;
    name: string;
    query: string;
    result: Record<string, unknown>[] | null;
    error: string | null;
}

interface NetSuiteQueryResponse {
    count: number;
    aliases: string[];
    [key: string]: unknown;
}

const convertResponse = (data: NetSuiteQueryResponse) => {
    const result = [];

    // Loop through each row using the count property
    for (let i = 0; i < data.count; i++) {
        const rowKey = `v${i}`;

        // If the row doesn't exist, skip it (optional error handling)
        if (!data[rowKey] || !Array.isArray(data[rowKey])) {
            continue;
        }

        const row = data[rowKey];
        const obj = {};

        // Map each alias (key) to the corresponding value in the row
        data.aliases.forEach((alias, index) => {
            obj[alias] = row[index];
        });

        result.push(obj);
    }

    return result;
};

// Constants for storage limits
const MAX_STORED_TABS = 20;
const MAX_QUERY_LENGTH = 50000; // ~50KB per query

const storage = new Storage();

interface StoredState {
    tabs: { id: string; name: string; query: string }[];
    activeTabId: string;
}

// Helper: load stored state (shared across all extension contexts)
const loadState = async (): Promise<StoredState | null> => {
    const state = await storage.get<StoredState>(LOCAL_QUERIES_KEY);
    return state || null;
};

// Helper: save the current tabs (only id, name, and query)
const saveState = (tabs: QueryTab[], activeTabId: string) => {
    // Only persist id, name, and query, with limits
    const storedTabs = tabs.slice(0, MAX_STORED_TABS).map(({ id, name, query }) => ({
        id,
        name,
        query: query.slice(0, MAX_QUERY_LENGTH),
    }));
    const state: StoredState = { tabs: storedTabs, activeTabId };
    storage.set(LOCAL_QUERIES_KEY, state);
};

interface SqlEditorProps {
    setIsOpen: (open: boolean) => void;
    isSidePanel?: boolean;
}

const DEFAULT_TAB: QueryTab = {
    id: "1",
    name: "Query 1",
    query: "SELECT * FROM entity",
    result: null,
    error: null,
};

export const SqlEditor = ({ setIsOpen, isSidePanel = false }: SqlEditorProps) => {
    const editorRef = useRef<ReactCodeMirrorRef>(null);

    const [tabs, setTabs] = useState<QueryTab[]>([DEFAULT_TAB]);
    const [activeTabId, setActiveTabId] = useState<string>("1");
    const [cachedSchema, setCachedSchema] = useState<Schema | null>(null);

    // Load stored state and schema from chrome.storage.local on mount
    useEffect(() => {
        loadState().then((storedState) => {
            if (storedState && storedState.tabs.length > 0) {
                setTabs(
                    storedState.tabs.map((t) => ({
                        ...t,
                        result: null,
                        error: null,
                    }))
                );
                setActiveTabId(storedState.activeTabId || "1");
            }
        });
        loadSchema().then(setCachedSchema);
    }, []);

    const [loading, setLoading] = useState(false);
    const [dataFormat, setDataFormat] = useState<"table" | "json" | "csv">("table");
    const [bottomPanelSize, setBottomPanelSize] = useState<number | undefined>(undefined);
    const bottomPanelRef = useRef<HTMLDivElement>(null);
    const [queryStats, dispatchQueryStats] = useReducer(mergeReducer, {
        time: undefined,
    });

    const activeTab = tabs.find((tab) => tab.id === activeTabId)!;
    const { theme, toggleTheme } = useTheme();
    const { displayMode, setDisplayMode } = useDisplayMode("sql-editor");

    const handleToggleDisplayMode = useCallback(async () => {
        if (isSidePanel) {
            // Currently in side panel, switch to dialog mode
            // Wait for storage write to complete before closing
            await setDisplayMode("dialog");
            // Tell content script to open dialog, then close side panel
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                const tabId = tabs[0]?.id;
                if (tabId) {
                    chrome.tabs.sendMessage(tabId, { action: "OPEN_SQL_EDITOR" });
                }
            });
            window.close(); // Close the side panel
        } else {
            // Currently in dialog, switch to side panel mode
            await setDisplayMode("side-panel");
            setIsOpen(false);
            openSidePanel("sql-editor");
        }
    }, [isSidePanel, setDisplayMode, setIsOpen]);

    const getSelectedText = useCallback((): string | null => {
        const view = editorRef.current?.view;
        if (!view) return null;
        const selection = view.state.selection.main;
        if (selection.empty) return null;
        return view.state.sliceDoc(selection.from, selection.to);
    }, []);

    const updateQuery = useCallback(
        (value: string) => {
            setTabs((prevTabs) =>
                prevTabs.map((tab) => (tab.id === activeTabId ? { ...tab, query: value } : tab))
            );
        },
        [activeTabId]
    );

    // Save the current state each time the tabs change.
    useEffect(() => {
        saveState(tabs, activeTabId);
    }, [tabs, activeTabId]);

    const handleSubmit = useCallback(async () => {
        console.log("🟣 [SqlEditor] handleSubmit called", { isSidePanel });
        setLoading(true);
        const start = Date.now();

        // Use selected text if available, otherwise use full query
        const selectedText = getSelectedText();
        const queryToExecute = selectedText || activeTab.query;

        try {
            // Use mock data only in local dev (not on NetSuite and not in side panel)
            if (!isNetSuite() && !isSidePanel) {
                console.log("🟣 [SqlEditor] Using mock data (local dev)");
                window.setTimeout(() => {
                    dispatchQueryStats({ time: Date.now() - start });
                    setTabs((prevTabs) =>
                        prevTabs.map((tab) =>
                            tab.id === activeTabId ? { ...tab, result: mockData, error: null } : tab
                        )
                    );
                    setLoading(false);
                }, MOCK_QUERY_DELAY_MS);
                return;
            }

            console.log("🟣 [SqlEditor] Calling executeQuery");
            const { error, data } = await executeQuery(queryToExecute);
            console.log("🟣 [SqlEditor] executeQuery returned", {
                error,
                data,
                dataKeys: data ? Object.keys(data) : null,
            });

            if (error) {
                setTabs((prevTabs) =>
                    prevTabs.map((tab) =>
                        tab.id === activeTabId ? { ...tab, error, result: null } : tab
                    )
                );
            } else {
                console.log("🟣 [SqlEditor] data.result", data?.result);
                console.log("🟣 [SqlEditor] data.result.result", data?.result?.result);
                const parsedResponseResult = convertResponse(data.result.result);
                setTabs((prevTabs) =>
                    prevTabs.map((tab) =>
                        tab.id === activeTabId
                            ? { ...tab, result: parsedResponseResult, error: null }
                            : tab
                    )
                );
                dispatchQueryStats({ time: Date.now() - start });
            }
        } catch (err: unknown) {
            const errorMessage =
                err instanceof Error ? err.message : "An unexpected error occurred";
            setTabs((prevTabs) =>
                prevTabs.map((tab) =>
                    tab.id === activeTabId ? { ...tab, error: errorMessage } : tab
                )
            );
        } finally {
            setLoading(false);
        }
    }, [activeTabId, activeTab.query, getSelectedText, isSidePanel]);

    const addTab = () => {
        const usedNumbers = tabs
            .map((tab) => {
                const match = tab.name.match(/^Query (\d+)$/);
                return match ? parseInt(match[1], 10) : 0;
            })
            .filter((n) => n > 0)
            .sort((a, b) => a - b);

        let nextNum = 1;
        for (const num of usedNumbers) {
            if (num === nextNum) nextNum++;
            else break;
        }

        const newId = Date.now().toString();
        const newTab: QueryTab = {
            id: newId,
            name: `Query ${nextNum}`,
            query: "",
            result: null,
            error: null,
        };
        setTabs([...tabs, newTab]);
        setActiveTabId(newId);
    };

    const removeTab = (tabId: string) => {
        if (tabs.length === 1) return; // Prevent removing last tab
        const newTabs = tabs.filter((tab) => tab.id !== tabId);
        if (activeTabId === tabId) {
            setActiveTabId(newTabs[0].id);
        }
        setTabs(newTabs);
    };

    const handleFormat = useCallback(() => {
        const formattedSQL = sqlFormat(activeTab.query, SQL_FORMATTER_CONFIG);
        updateQuery(formattedSQL);
    }, [activeTab.query, updateQuery]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent): void => {
            if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === "Enter") {
                event.preventDefault();
                event.stopImmediatePropagation();
                handleSubmit();
                return;
            }
            if (
                event.shiftKey === true &&
                (event.metaKey || event.ctrlKey) &&
                event.code === "KeyF"
            ) {
                event.preventDefault();
                event.stopImmediatePropagation();
                handleFormat();
                return;
            }
            if (event.key === "Escape" && !isSidePanel) {
                event.preventDefault();
                event.stopImmediatePropagation();
                setIsOpen(false);
                return;
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [handleFormat, handleSubmit, setIsOpen, isSidePanel]);

    return (
        <div className="plasmo:bg-background plasmo:text-foreground plasmo:z-1001 plasmo:flex plasmo:flex-col plasmo:h-full plasmo:w-full">
            <PanelGroup direction="vertical">
                <Panel defaultSize={60} minSize={30}>
                    <div className="plasmo:flex plasmo:h-full plasmo:flex-col plasmo:gap-1 plasmo:lg:gap-2">
                        <div className="plasmo:flex plasmo:items-center plasmo:justify-between plasmo:px-4! plasmo:py-2!">
                            <div className="plasmo:flex plasmo:items-center plasmo:gap-4 plasmo:lg:gap-12">
                                <div className="plasmo:flex plasmo:items-center plasmo:gap-2">
                                    <Database className="plasmo:size-3 plasmo:lg:size-5 plasmo:text-blue-400" />
                                    <div className="plasmo:text-sm plasmo:lg:text-lg plasmo:font-bold">
                                        SuiteQL Editor
                                    </div>
                                    <HelpDropdown />
                                </div>
                                <div className="plasmo:flex plasmo:items-center plasmo:gap-4 plasmo:lg:gap-12 plasmo:text-xs plasmo:lg:text-base">
                                    <div className="plasmo:flex plasmo:items-center plasmo:gap-1 plasmo:lg:gap-2">
                                        <div className="">
                                            {isSidePanel ? "Time" : "Execution Time"}
                                        </div>
                                        {loading || !queryStats.time
                                            ? "-"
                                            : formatTime(queryStats.time)}
                                    </div>
                                    <div className="plasmo:flex plasmo:items-center plasmo:gap-1 plasmo:lg:gap-2">
                                        <div className="">
                                            {isSidePanel ? "Count" : "Row Count"}
                                        </div>
                                        {loading ? "-" : activeTab.result?.length || "-"}
                                    </div>
                                </div>
                            </div>
                            {!isSidePanel && (
                                <div>
                                    <Button
                                        onClick={() => setIsOpen(false)}
                                        variant={"ghost"}
                                        size={"icon"}
                                        className={"plasmo:cursor-pointer"}
                                    >
                                        <X className="plasmo:size-5" />
                                    </Button>
                                </div>
                            )}
                        </div>

                        <div className="plasmo:flex plasmo:flex-wrap plasmo:lg:flex-nowrap plasmo:justify-between plasmo:gap-2 plasmo:lg:gap-4 plasmo:px-2!">
                            <div
                                className={
                                    "plasmo:flex plasmo:items-center plasmo:gap-1 plasmo:overflow-auto plasmo:shrink plasmo:min-w-0"
                                }
                            >
                                {tabs.map((tab) => (
                                    <div
                                        key={tab.id}
                                        role="tab"
                                        tabIndex={0}
                                        className={clsx(
                                            `plasmo:group plasmo:flex plasmo:cursor-pointer plasmo:items-center plasmo:gap-1 plasmo:rounded-lg plasmo:whitespace-nowrap plasmo:transition-colors plasmo:border-2 plasmo:border-solid`,
                                            activeTabId === tab.id
                                                ? "plasmo:bg-card plasmo:text-foreground plasmo:border-primary"
                                                : "plasmo:hover:bg-card plasmo:hover:text-foreground plasmo:bg-card/70 plasmo:border-transparent plasmo:text-muted-foreground",
                                            tabs.length > 1
                                                ? "plasmo:px-2! plasmo:lg:px-2!"
                                                : "plasmo:px-2! plasmo:lg:px-4!"
                                        )}
                                        onClick={() => setActiveTabId(tab.id)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" || e.key === " ") {
                                                e.preventDefault();
                                                setActiveTabId(tab.id);
                                            }
                                        }}
                                    >
                                        <div className="plasmo:text-sm plasmo:py-1! plasmo:lg:py-2!">
                                            {tab.name}
                                        </div>
                                        {tabs.length > 1 && (
                                            <Button
                                                className={cn(
                                                    "plasmo:cursor-pointer plasmo:rounded-full plasmo:size-5 plasmo:lg-size-8",
                                                    activeTabId === tab.id
                                                        ? "plasmo:visible"
                                                        : "plasmo:invisible plasmo:group-hover:visible"
                                                )}
                                                size={"icon-sm"}
                                                variant={"ghost"}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeTab(tab.id);
                                                }}
                                            >
                                                <X className="plasmo:size-3 plasmo:lg:size-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                                <Button
                                    variant="outline"
                                    size={isSidePanel ? "icon-sm" : "icon"}
                                    onClick={addTab}
                                    className="plasmo:cursor-pointer"
                                >
                                    <Plus className="plasmo:size-4 plasmo:lg:size-6" />
                                </Button>
                            </div>

                            <div className="plasmo:flex plasmo:items-center plasmo:justify-end plasmo:gap-1 plasmo:lg:gap-2 plasmo:flex-shrink-0">
                                <CopyDropdown data={activeTab.result} isFetching={loading} />
                                <DownloadDropdown data={activeTab.result} isFetching={loading} />
                                <Button
                                    onClick={handleToggleDisplayMode}
                                    variant="ghost"
                                    size="icon"
                                    title={
                                        displayMode === "dialog"
                                            ? "Switch to side panel"
                                            : "Switch to dialog"
                                    }
                                >
                                    <PanelRight className="plasmo:size-5" />
                                </Button>
                                {!isSidePanel && (
                                    <Button onClick={toggleTheme} variant="ghost" size="icon">
                                        {theme === "dark-grey" ? (
                                            <Sun className="plasmo:size-5" />
                                        ) : (
                                            <Moon className="plasmo:size-5" />
                                        )}
                                    </Button>
                                )}
                                <Select
                                    value={dataFormat}
                                    onValueChange={(newValue: "table" | "json" | "csv") => {
                                        setDataFormat(newValue);
                                    }}
                                >
                                    <SelectTrigger className="plasmo:w-auto">
                                        <SelectValue placeholder="Format" />
                                    </SelectTrigger>
                                    <SelectContent className={"plasmo:z-10002"}>
                                        <SelectGroup className={"plasmo:py-1!"}>
                                            {VIEW_TYPES.map((item) => {
                                                return (
                                                    <SelectItem
                                                        key={item.id}
                                                        value={item.id}
                                                        className={"plasmo:px-4! plasmo:py-2!"}
                                                    >
                                                        {item.label}
                                                    </SelectItem>
                                                );
                                            })}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                                <Button
                                    size="sm"
                                    onClick={handleFormat}
                                    className="plasmo:hidden plasmo:lg:inline-flex"
                                >
                                    Format
                                </Button>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className={
                                        "plasmo:bg-green-400 plasmo:hover:bg-green-500 plasmo:active:bg-green-700 plasmo:cursor-pointer plasmo:text-black plasmo:hover:text-black"
                                    }
                                    onClick={handleSubmit}
                                >
                                    <Play size={16} />
                                </Button>
                            </div>
                        </div>
                        <div className="plasmo:flex-1 plasmo:overflow-hidden">
                            <CodeMirror
                                ref={editorRef}
                                value={activeTab.query}
                                height="100%"
                                extensions={[sql(getSuiteqlConfig(cachedSchema))]}
                                theme={theme === "light" ? [lightTheme] : [oneDark, darkGreyTheme]}
                                onChange={updateQuery}
                                className="plasmo:h-full plasmo:rounded-lg plasmo:border plasmo:border-gray-700"
                            />
                        </div>
                    </div>
                </Panel>
                <PanelResizeHandle
                    className={
                        "plasmo:bg-card plasmo:hover:bg-primary plasmo:h-2 plasmo:transition-colors"
                    }
                />
                <Panel
                    minSize={DEFAULT_PANEL_MIN_SIZE}
                    onResize={() => {
                        setBottomPanelSize(bottomPanelRef.current?.offsetHeight);
                    }}
                >
                    <div ref={bottomPanelRef} className={"plasmo:h-full plasmo:overflow-auto"}>
                        {activeTab.error && (
                            <div className="plasmo:bg-destructive plasmo:text-black plasmo:mb-4 plasmo:rounded-lg plasmo:border-red-500 plasmo:p-3!">
                                {activeTab.error}
                            </div>
                        )}

                        <DataContent
                            data={activeTab.result}
                            dataFormat={dataFormat}
                            loading={loading}
                            bottomPanelRef={bottomPanelRef}
                            bottomPanelSize={bottomPanelSize}
                        />
                    </div>
                </Panel>
            </PanelGroup>
        </div>
    );
};
