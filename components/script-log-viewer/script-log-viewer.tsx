import { Button } from "@/components/ui/button";
import { ComboboxMulti } from "@/components/ui/combobox-multi";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
    ChevronsDownUp,
    ChevronsUpDown,
    FileText,
    Filter,
    Moon,
    RotateCw,
    Sun,
    X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useTheme } from "~lib/contexts/theme-context";
import { executeQuery } from "~lib/fetch-query";
import { isNetSuite } from "~lib/is-netsuite";

import { LOCAL_STORAGE_KEY } from "./constants";
import { LogRow } from "./log-row";
import { logTypeOptions, scriptLogMockData, scriptOptions } from "./mock-data";

interface ScriptLogViewerProps {
    setIsOpen: (open: boolean) => void;
}

interface LogEntry {
    id: string;
    date: string;
    type: string;
    script_name?: string;
    script_id?: string;
    title: string;
    detail: string;
    user: string;
}

interface Filters {
    type: string[];
    scripts: string[];
    title: string;
    detail: string;
    fromDate: number | null;
    toDate: number | null;
}

const MOCK_QUERY_DELAY_MS = 350;

const getTodayAtMidnight = (): number => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now.getTime();
};

interface StoredState {
    filters: Filters;
    defaultExpanded?: boolean;
}

const loadState = (): StoredState | null => {
    try {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {
        console.error("Error loading script log viewer state:", e);
    }
    return null;
};

const saveState = (filters: Filters, defaultExpanded: boolean) => {
    try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ filters, defaultExpanded }));
    } catch (e) {
        console.error("Error saving script log viewer state:", e);
    }
};

const formatMultiSelectStrings = (values: string[]): string => {
    return values.map((v) => `'${v}'`).join(", ");
};

const escapeSqlString = (value: string): string => {
    // Escape single quotes by doubling them
    // Strip double quotes - SuiteQL doesn't support them in LIKE patterns
    return value.replace(/'/g, "''").replace(/"/g, "");
};

const formatDateForQuery = (timestamp: number, offsetInMilliseconds: number): string => {
    const d = new Date(timestamp + offsetInMilliseconds);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
};

const formatHourOffset = (offsetInHours: number): string => {
    const sign = offsetInHours >= 0 ? "+" : "-";
    const absoluteOffset = Math.abs(offsetInHours);
    const hours = Math.floor(absoluteOffset);
    const minutes = Math.round((absoluteOffset - hours) * 60);
    return `${sign}${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

const buildScriptLogQuery = (
    filters: Filters,
    offsetInHours: number,
    offsetInMilliseconds: number
): string => {
    const where: string[] = [];

    if (filters.type && filters.type.length > 0) {
        where.push(`scriptNote.type IN (${formatMultiSelectStrings(filters.type)})`);
    }

    if (filters.scripts && filters.scripts.length > 0) {
        where.push(`script.id IN (${filters.scripts.join(", ")})`);
    }

    if (filters.title) {
        where.push(`scriptNote.title LIKE '%${escapeSqlString(filters.title)}%'`);
    }

    if (filters.detail) {
        where.push(`scriptNote.detail LIKE '%${escapeSqlString(filters.detail)}%'`);
    }

    if (filters.fromDate) {
        const fromDateStr = formatDateForQuery(filters.fromDate, offsetInMilliseconds);
        where.push(`scriptNote.date >= TO_DATE('${fromDateStr}', 'YYYY-MM-DD HH24:MI:SS')`);
    }

    if (filters.toDate) {
        const toDateStr = formatDateForQuery(filters.toDate, offsetInMilliseconds);
        where.push(`scriptNote.date <= TO_DATE('${toDateStr}', 'YYYY-MM-DD HH24:MI:SS')`);
    }

    const tzOffset = formatHourOffset(offsetInHours);
    const sql = `SELECT scriptNote.internalid AS id, TO_CHAR(scriptNote.date, 'YYYY-MM-DD HH24:MI:SS') || '${tzOffset}' AS date, scriptNote.title, scriptNote.detail, scriptNote.type, script.name as script_name, script.id as script_id FROM scriptNote INNER JOIN script ON scriptNote.scripttype = script.id ${where.length ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY scriptNote.date DESC`;

    return sql;
};

const convertResponse = (data: any): LogEntry[] => {
    if (!data || !data.count) return [];

    const result: LogEntry[] = [];

    for (let i = 0; i < data.count; i++) {
        const rowKey = `v${i}`;
        if (!data[rowKey] || !Array.isArray(data[rowKey])) continue;

        const row = data[rowKey];
        const obj: Record<string, any> = {};

        data.aliases.forEach((alias: string, index: number) => {
            obj[alias] = row[index];
        });

        result.push(obj as LogEntry);
    }

    return result;
};

const DateTimeInput = ({
    value,
    onChange,
    placeholder,
}: {
    value: number | null;
    onChange: (value: number | null) => void;
    placeholder: string;
}) => {
    const formatDateForInput = (timestamp: number | null): string => {
        if (!timestamp) return "";
        const date = new Date(timestamp);
        // Format as YYYY-MM-DDTHH:mm for datetime-local input
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (!val) {
            onChange(null);
        } else {
            onChange(new Date(val).getTime());
        }
    };

    return (
        <Input
            type="datetime-local"
            value={formatDateForInput(value)}
            onChange={handleChange}
            placeholder={placeholder}
        />
    );
};

export const ScriptLogViewer = ({ setIsOpen }: ScriptLogViewerProps) => {
    const parentRef = useRef<HTMLDivElement>(null);
    const { theme, toggleTheme } = useTheme();

    const storedState = useMemo(() => loadState(), []);

    const [filters, setFilters] = useState<Filters>(() => {
        if (storedState?.filters) {
            return storedState.filters;
        }
        return {
            type: [],
            scripts: [],
            title: "",
            detail: "",
            fromDate: getTodayAtMidnight(),
            toDate: null,
        };
    });

    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showFilters, setShowFilters] = useState(true);
    const [scriptOptionsList, setScriptOptionsList] = useState(scriptOptions);
    const [defaultExpanded, setDefaultExpanded] = useState(() => {
        const stored = loadState();
        return stored?.defaultExpanded ?? false;
    });
    const [expandKey, setExpandKey] = useState(0); // Used to force re-render of LogRow components

    // Save filters and preferences when they change
    useEffect(() => {
        saveState(filters, defaultExpanded);
    }, [filters, defaultExpanded]);

    const fetchScriptOptions = useCallback(async () => {
        if (!isNetSuite()) return;

        try {
            const query = `SELECT id, name FROM script ORDER BY name`;
            const { error, data } = await executeQuery(query);

            if (!error && data?.result?.result) {
                const converted = convertResponse(data.result.result);
                setScriptOptionsList(
                    converted.map((s: any) => ({
                        value: String(s.id),
                        label: s.name,
                    }))
                );
            }
        } catch (e) {
            console.error("Failed to fetch script options:", e);
        }
    }, []);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            if (!isNetSuite()) {
                // Use mock data for development
                await new Promise((resolve) => setTimeout(resolve, MOCK_QUERY_DELAY_MS));

                let filteredData = [...scriptLogMockData];

                if (filters.type.length > 0) {
                    filteredData = filteredData.filter((log) => filters.type.includes(log.type));
                }

                if (filters.scripts.length > 0) {
                    filteredData = filteredData.filter((log) =>
                        filters.scripts.includes(log.script_id || "")
                    );
                }

                if (filters.title) {
                    filteredData = filteredData.filter((log) =>
                        log.title.toLowerCase().includes(filters.title.toLowerCase())
                    );
                }

                if (filters.detail) {
                    filteredData = filteredData.filter((log) =>
                        log.detail.toLowerCase().includes(filters.detail.toLowerCase())
                    );
                }

                if (filters.fromDate) {
                    filteredData = filteredData.filter(
                        (log) => new Date(log.date).getTime() >= filters.fromDate!
                    );
                }

                if (filters.toDate) {
                    filteredData = filteredData.filter(
                        (log) => new Date(log.date).getTime() <= filters.toDate!
                    );
                }

                setLogs(filteredData);
                setLoading(false);
                return;
            }

            // Calculate timezone offset by querying the database for current time
            const tzQuery = `SELECT TO_CHAR(SYSDATE, 'YYYY-MM-DD HH24:MI:SS') AS servertime FROM DUAL`;
            const { error: tzError, data: tzData } = await executeQuery(tzQuery);

            let offsetInHours = 0;
            let offsetInMilliseconds = 0;

            if (!tzError && tzData?.result?.result?.count > 0) {
                const serverTimeStr = tzData.result.result.v0[0];
                // Parse server time as UTC (since we're treating the DB time as the reference)
                const serverTime = new Date(serverTimeStr.replace(" ", "T") + "Z");
                const localTime = new Date();
                // Calculate offset: how many hours ahead/behind is the server from local
                offsetInHours = Math.round(
                    (serverTime.getTime() - localTime.getTime()) / 1000 / 60 / 60
                );
                offsetInMilliseconds = offsetInHours * 60 * 60 * 1000;
            }

            const query = buildScriptLogQuery(filters, offsetInHours, offsetInMilliseconds);
            console.log("Script Log Query:", query);
            const { error: queryError, data } = await executeQuery(query);

            if (queryError) {
                setError(queryError);
                setLogs([]);
            } else {
                const converted = convertResponse(data?.result?.result);
                setLogs(converted);
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : "An unexpected error occurred");
            setLogs([]);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    // Track if this is the initial mount to avoid double-fetching
    const isFirstRender = useRef(true);

    // Fetch logs on mount
    useEffect(() => {
        fetchLogs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Auto-search with debounce when text/multi-select filters change
    useEffect(() => {
        // Skip the initial mount (handled by the effect above)
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        const timeoutId = setTimeout(() => {
            fetchLogs();
        }, 500);

        return () => clearTimeout(timeoutId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters.type, filters.scripts, filters.title, filters.detail]);

    // Immediate search when date filters change
    const prevFromDate = useRef(filters.fromDate);
    const prevToDate = useRef(filters.toDate);

    useEffect(() => {
        const fromDateChanged = prevFromDate.current !== filters.fromDate;
        const toDateChanged = prevToDate.current !== filters.toDate;

        if (fromDateChanged || toDateChanged) {
            prevFromDate.current = filters.fromDate;
            prevToDate.current = filters.toDate;
            fetchLogs();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters.fromDate, filters.toDate]);

    // Fetch script options on mount
    useEffect(() => {
        fetchScriptOptions();
    }, [fetchScriptOptions]);

    const virtualizer = useVirtualizer({
        count: logs.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 56,
    });

    const items = virtualizer.getVirtualItems();

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                e.preventDefault();
                e.stopImmediatePropagation();
                setIsOpen(false);
            }
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                e.stopImmediatePropagation();
                fetchLogs();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [setIsOpen, fetchLogs]);

    const updateFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    return (
        <div
            className="plasmo:bg-background plasmo:text-foreground plasmo:z-1001 plasmo:flex plasmo:flex-col plasmo:rounded-lg plasmo:overflow-hidden"
            style={{ height: "calc(100vh - 2vh)", width: "calc(100vw - 2vw)" }}
        >
            {/* Header */}
            <div className="plasmo:flex plasmo:items-center plasmo:justify-between plasmo:px-4! plasmo:py-3! plasmo:border-b plasmo:border-card">
                <div className="plasmo:flex plasmo:items-center plasmo:gap-3">
                    <span className="plasmo:text-lg plasmo:font-bold">SuiteScript Script Logs</span>
                    <span className="plasmo:text-muted-foreground plasmo:text-sm">
                        {logs.length} logs
                    </span>
                </div>
                <div className="plasmo:flex plasmo:items-center plasmo:gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowFilters(!showFilters)}
                        className="plasmo:cursor-pointer"
                    >
                        <Filter className="plasmo:size-4 plasmo:mr-2" />
                        {showFilters ? "Hide Filters" : "Show Filters"}
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleTheme}
                        className="plasmo:cursor-pointer"
                    >
                        {theme === "dark-grey" ? (
                            <Sun className="plasmo:size-5" />
                        ) : (
                            <Moon className="plasmo:size-5" />
                        )}
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsOpen(false)}
                        className="plasmo:cursor-pointer"
                    >
                        <X className="plasmo:size-5" />
                    </Button>
                </div>
            </div>

            {/* Filters */}
            {showFilters && (
                <div className="plasmo:px-4! plasmo:py-3! plasmo:border-b plasmo:border-card plasmo:bg-card/30">
                    <div className="plasmo:grid plasmo:grid-cols-6 plasmo:gap-3">
                        <Field>
                            <FieldLabel>Log Type</FieldLabel>
                            <ComboboxMulti
                                options={logTypeOptions}
                                value={filters.type}
                                onChange={(val) => updateFilter("type", val)}
                                placeholder="All types"
                                searchPlaceholder="Search types..."
                            />
                        </Field>

                        <Field>
                            <FieldLabel>Script</FieldLabel>
                            <ComboboxMulti
                                options={scriptOptionsList}
                                value={filters.scripts}
                                onChange={(val) => updateFilter("scripts", val)}
                                placeholder="All scripts"
                                searchPlaceholder="Search scripts..."
                            />
                        </Field>

                        <Field>
                            <FieldLabel>Title</FieldLabel>
                            <Input
                                type="text"
                                value={filters.title}
                                onChange={(e) => updateFilter("title", e.target.value)}
                                placeholder="Search title..."
                            />
                        </Field>

                        <Field>
                            <FieldLabel>Detail</FieldLabel>
                            <Input
                                type="text"
                                value={filters.detail}
                                onChange={(e) => updateFilter("detail", e.target.value)}
                                placeholder="Search detail..."
                            />
                        </Field>

                        <Field>
                            <FieldLabel>From</FieldLabel>
                            <DateTimeInput
                                value={filters.fromDate}
                                onChange={(val) => updateFilter("fromDate", val)}
                                placeholder="From date"
                            />
                        </Field>

                        <Field>
                            <FieldLabel>To</FieldLabel>
                            <DateTimeInput
                                value={filters.toDate}
                                onChange={(val) => updateFilter("toDate", val)}
                                placeholder="To date"
                            />
                        </Field>
                    </div>
                </div>
            )}

            {/* Toolbar - always visible */}
            <div className="plasmo:flex plasmo:items-center plasmo:justify-between plasmo:gap-2 plasmo:px-4! plasmo:py-2! plasmo:border-b plasmo:border-card plasmo:bg-card/30">
                <div className="plasmo:flex plasmo:items-center plasmo:gap-4">
                    <label className="plasmo:flex plasmo:items-center plasmo:gap-2 plasmo:cursor-pointer">
                        <input
                            type="checkbox"
                            checked={defaultExpanded}
                            onChange={(e) => setDefaultExpanded(e.target.checked)}
                            className="plasmo:rounded"
                        />
                        <span className="plasmo:text-sm">Auto-expand logs</span>
                    </label>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            setDefaultExpanded(true);
                            setExpandKey((k) => k + 1);
                        }}
                        className="plasmo:cursor-pointer"
                    >
                        <ChevronsUpDown className="plasmo:size-4 plasmo:mr-1" />
                        Expand All
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            setDefaultExpanded(false);
                            setExpandKey((k) => k + 1);
                        }}
                        className="plasmo:cursor-pointer"
                    >
                        <ChevronsDownUp className="plasmo:size-4 plasmo:mr-1" />
                        Collapse All
                    </Button>
                </div>
                <div className="plasmo:flex plasmo:items-center plasmo:gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            setFilters((prev) => ({
                                ...prev,
                                fromDate: Date.now(),
                                toDate: null,
                            }));
                            setLogs([]);
                        }}
                        className="plasmo:cursor-pointer"
                    >
                        Remove All
                    </Button>
                    <Button
                        size="icon"
                        onClick={fetchLogs}
                        disabled={loading}
                        // variant="secondary"
                        className="plasmo:cursor-pointer"
                    >
                        {loading ? (
                            <Spinner className="plasmo:size-4" />
                        ) : (
                            <RotateCw className="plasmo:size-4" />
                        )}
                    </Button>
                </div>
            </div>

            {/* Error display */}
            {error && (
                <div className="plasmo:bg-destructive plasmo:text-black plasmo:px-4! plasmo:py-3!">
                    {error}
                </div>
            )}

            {/* Log list */}
            <div
                ref={parentRef}
                className="plasmo:flex-1 plasmo:overflow-auto"
                style={{ contain: "strict" }}
            >
                {loading && logs.length === 0 ? (
                    <div className="plasmo:flex plasmo:items-center plasmo:justify-center plasmo:h-full">
                        <Spinner className="plasmo:size-12" />
                    </div>
                ) : logs.length === 0 ? (
                    <div className="plasmo:flex plasmo:flex-col plasmo:items-center plasmo:justify-center plasmo:h-full plasmo:text-muted-foreground">
                        <FileText className="plasmo:size-12 plasmo:mb-4" />
                        <span>No logs found</span>
                        <span className="plasmo:text-sm">Try adjusting your filters</span>
                    </div>
                ) : (
                    <div
                        style={{
                            height: virtualizer.getTotalSize(),
                            width: "100%",
                            position: "relative",
                        }}
                    >
                        <div
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                transform: `translateY(${items[0]?.start ?? 0}px)`,
                            }}
                        >
                            {items.map((virtualRow) => (
                                <div
                                    key={`${expandKey}-${virtualRow.key}`}
                                    data-index={virtualRow.index}
                                    ref={virtualizer.measureElement}
                                >
                                    <LogRow
                                        row={logs[virtualRow.index]}
                                        defaultExpanded={defaultExpanded}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
