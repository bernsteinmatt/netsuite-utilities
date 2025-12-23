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
import { Database, Moon, Play, Plus, Sun, X } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { format as sqlFormat } from "sql-formatter";

import { darkGreyTheme, lightTheme } from "~lib/codemirror-themes";
import { LOCAL_QUERIES_KEY } from "~lib/constants";
import { useTheme } from "~lib/contexts/theme-context";
import { isNetSuite } from "~lib/is-netsuite";
import { mergeReducer } from "~lib/merge-reducer";
import { executeQuery } from "~lib/netsuite";
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

// Helper: load stored state from local storage.
const loadState = () => {
    const stateString = localStorage.getItem(LOCAL_QUERIES_KEY);
    if (!stateString) return null;
    try {
        return JSON.parse(stateString);
    } catch (e) {
        console.error("Error parsing sql editor state:", e);
        return null;
    }
};

// Constants for storage limits
const MAX_STORED_TABS = 20;
const MAX_QUERY_LENGTH = 50000; // ~50KB per query

// Helper: save the current tabs (only id, name, and query) to local storage.
const saveState = (tabs: QueryTab[], activeTabId: string) => {
    // Only persist id, name, and query, with limits
    const storedTabs = tabs.slice(0, MAX_STORED_TABS).map(({ id, name, query }) => ({
        id,
        name,
        query: query.slice(0, MAX_QUERY_LENGTH),
    }));
    const state = { tabs: storedTabs, activeTabId };
    try {
        localStorage.setItem(LOCAL_QUERIES_KEY, JSON.stringify(state));
    } catch (e) {
        if (e instanceof DOMException && e.name === "QuotaExceededError") {
            console.warn("localStorage quota exceeded, clearing saved queries");
            localStorage.removeItem(LOCAL_QUERIES_KEY);
        }
    }
};

interface SqlEditorProps {
    setIsOpen: (open: boolean) => void;
}

export const SqlEditor = ({ setIsOpen }: SqlEditorProps) => {
    const storedState = useMemo(() => loadState(), []);
    const editorRef = useRef<ReactCodeMirrorRef>(null);

    const [tabs, setTabs] = useState<QueryTab[]>(() => {
        if (storedState && storedState.tabs.length > 0) {
            // When restoring, set result and error to null.
            return storedState.tabs.map((t) => ({
                ...t,
                result: null,
                error: null,
            }));
        }
        return [
            {
                id: "1",
                name: "Query 1",
                query: "SELECT * FROM entity",
                result: null,
                error: null,
            },
        ];
    });

    // Initialize activeTabId from the stored state, defaulting to "1".
    const [activeTabId, setActiveTabId] = useState<string>(() => storedState?.activeTabId || "1");

    const [loading, setLoading] = useState(false);
    const [dataFormat, setDataFormat] = useState<"table" | "json" | "csv">("table");
    const [bottomPanelSize, setBottomPanelSize] = useState<number | undefined>(undefined);
    const bottomPanelRef = useRef<HTMLDivElement>(null);
    const [queryStats, dispatchQueryStats] = useReducer(mergeReducer, {
        time: undefined,
    });

    const activeTab = tabs.find((tab) => tab.id === activeTabId)!;
    const { theme, toggleTheme } = useTheme();

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
        setLoading(true);
        const start = Date.now();

        // Use selected text if available, otherwise use full query
        const selectedText = getSelectedText();
        const queryToExecute = selectedText || activeTab.query;

        try {
            if (!isNetSuite()) {
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

            const { error, data } = await executeQuery(queryToExecute);

            if (error) {
                setTabs((prevTabs) =>
                    prevTabs.map((tab) =>
                        tab.id === activeTabId ? { ...tab, error, result: null } : tab
                    )
                );
            } else {
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
    }, [activeTabId, activeTab.query, getSelectedText]);

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
            if (event.key === "Escape") {
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
    }, [handleFormat, handleSubmit, setIsOpen]);

    return (
        <div
            className="plasmo:bg-background plasmo:text-foreground plasmo:z-1001 plasmo:flex plasmo:flex-col"
            style={{ height: "calc(100vh - 2vh)", width: "calc(100vw - 2vw)" }}
        >
            <PanelGroup direction="vertical">
                <Panel defaultSize={60} minSize={30}>
                    <div className="plasmo:flex plasmo:h-full plasmo:flex-col plasmo:gap-2">
                        <div className="plasmo:flex plasmo:items-center plasmo:justify-between plasmo:px-4! plasmo:py-2!">
                            <div className="plasmo:flex plasmo:items-center plasmo:gap-12">
                                <div className="plasmo:flex plasmo:items-center plasmo:gap-2">
                                    <Database className="plasmo:size-5 plasmo:text-blue-400" />
                                    <div className="plasmo:text-lg plasmo:font-bold">
                                        SuiteQL Editor
                                    </div>
                                    <HelpDropdown />
                                </div>
                                <div className="plasmo:flex plasmo:items-center plasmo:gap-12">
                                    <div className="plasmo:flex plasmo:items-center plasmo:gap-2">
                                        <div>Execution Time</div>
                                        {loading || !queryStats.time
                                            ? "-"
                                            : formatTime(queryStats.time)}
                                    </div>
                                    <div className="plasmo:flex plasmo:items-center plasmo:gap-2">
                                        <div>Row Count</div>
                                        {loading ? "-" : activeTab.result?.length || "-"}
                                    </div>
                                </div>
                            </div>
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
                        </div>

                        <div className="plasmo:flex plasmo:flex-nowrap plasmo:justify-between plasmo:gap-4 plasmo:px-2!">
                            <div
                                className={
                                    "plasmo:col-span-9 plasmo:flex plasmo:items-center plasmo:gap-1 plasmo:overflow-auto"
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
                                            tabs.length > 1 ? "plasmo:px-2!" : "plasmo:px-4!"
                                        )}
                                        onClick={() => setActiveTabId(tab.id)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" || e.key === " ") {
                                                e.preventDefault();
                                                setActiveTabId(tab.id);
                                            }
                                        }}
                                    >
                                        <div className="plasmo:text-sm plasmo:py-2!">
                                            {tab.name}
                                        </div>
                                        {tabs.length > 1 && (
                                            <Button
                                                className={cn(
                                                    "plasmo:cursor-pointer plasmo:rounded-full",
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
                                                <X className="plasmo:size-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={addTab}
                                    className="plasmo:cursor-pointer"
                                >
                                    <Plus className="plasmo:size-6" />
                                </Button>
                            </div>

                            <div className="plasmo:col-span-1 plasmo:flex plasmo:items-center plasmo:justify-end plasmo:gap-2">
                                <div className="plasmo:flex plasmo:items-center plasmo:gap-2">
                                    <CopyDropdown data={activeTab.result} isFetching={loading} />
                                    <DownloadDropdown
                                        data={activeTab.result}
                                        isFetching={loading}
                                    />
                                    <Button onClick={toggleTheme} variant="ghost" size="sm">
                                        {theme === "dark-grey" ? (
                                            <Sun className="plasmo:size-5" />
                                        ) : (
                                            <Moon className="plasmo:size-5" />
                                        )}
                                    </Button>
                                    <Select
                                        value={dataFormat}
                                        onValueChange={(newValue: "table" | "json" | "csv") => {
                                            setDataFormat(newValue);
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Format" />
                                        </SelectTrigger>
                                        <SelectContent>
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
                                </div>
                                <div className={"plasmo:flex plasmo:items-center plasmo:gap-2"}>
                                    <Button size="sm" onClick={handleFormat}>
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
                        </div>
                        <div className="plasmo:flex-1 plasmo:overflow-hidden">
                            <CodeMirror
                                ref={editorRef}
                                value={activeTab.query}
                                height="100%"
                                extensions={[sql(getSuiteqlConfig())]}
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
