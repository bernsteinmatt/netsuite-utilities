import { CopyButton } from "@/components/ui/copy-button";
import { Spinner } from "@/components/ui/spinner";
import { AlertCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { debugLog } from "~lib/debug";
import { useCurrentRecord } from "~lib/hooks/use-current-record";
import { fetchQuery } from "~lib/netsuite";

import { JsonNode } from "@/components/record-detail/json-node";
import {
    RECORD_TYPE_TO_TABLE,
    URL_PATTERNS,
    type RelatedTable,
    type TableLookup,
} from "@/components/record-detail/url-patterns";

/**
 * Helper to sort object keys alphabetically (recursively for nested objects/arrays)
 */
const sortObjectKeys = (obj: unknown): unknown => {
    if (obj === null || obj === undefined) return obj;

    if (Array.isArray(obj)) {
        return obj.map((item) => sortObjectKeys(item));
    }

    if (typeof obj === "object") {
        const sorted = Object.entries(obj as Record<string, unknown>)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([key, value]) => [key, sortObjectKeys(value)]);
        return Object.fromEntries(sorted);
    }

    return obj;
};

/**
 * Fetch record type and ID from XML source as a fallback
 * when URL patterns don't match and currentRecord module fails
 */
const fetchRecordInfoFromXml = async (): Promise<{
    recordType: string | null;
    id: string | null;
    error: string | null;
}> => {
    try {
        const currentUrl = window.location.href;
        const xmlUrl = currentUrl.includes("?") ? `${currentUrl}&xml=T` : `${currentUrl}?xml=T`;

        debugLog("SuiteQL", "Fetching XML for record info:", xmlUrl);
        const response = await fetch(xmlUrl);

        if (!response.ok) {
            return { recordType: null, id: null, error: `HTTP ${response.status}` };
        }

        const xmlText = await response.text();

        // Check if we got HTML instead of XML
        if (xmlText.trim().startsWith("<!DOCTYPE") || xmlText.trim().startsWith("<html")) {
            return { recordType: null, id: null, error: "Not on a record page" };
        }

        // Parse XML to extract recordType and id attributes
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "text/xml");

        const parseError = xmlDoc.querySelector("parsererror");
        if (parseError) {
            return { recordType: null, id: null, error: "XML parse error" };
        }

        // The record element has recordType and id attributes
        const recordElement = xmlDoc.querySelector("record");
        if (!recordElement) {
            return { recordType: null, id: null, error: "No record element found in XML" };
        }

        const recordType = recordElement.getAttribute("recordType");
        const id = recordElement.getAttribute("id");

        debugLog("SuiteQL", "Parsed XML record info:", { recordType, id });

        return { recordType, id, error: null };
    } catch (err) {
        return {
            recordType: null,
            id: null,
            error: err instanceof Error ? err.message : "Unknown error",
        };
    }
};

interface SuiteQLRecordDetailProps {
    searchTerm: string;
    forceExpanded?: boolean;
    showEmptyFields?: boolean;
    onRecordInfoChange?: (info: { recordType: string | null; id: string | null }) => void;
    onRecordChange?: (record: Record<string, unknown> | null) => void;
}

interface ParsedUrlInfo {
    id: string | null;
    /** Column name to use in WHERE clause (defaults to "id") */
    idColumn: string;
    rectypeValue: string | null;
    lookupTables: TableLookup[];
    staticTable: string | null;
    relatedTables: RelatedTable[];
}

/**
 * Parse URL to detect record information based on URL pattern definitions
 */
const parseRecordFromUrl = (): ParsedUrlInfo => {
    const url = new URL(window.location.href);
    const pathname = url.pathname;

    debugLog("SuiteQL", "Parsing URL:", { href: url.href, pathname });

    for (const pattern of URL_PATTERNS) {
        if (pathname.includes(pattern.pathPattern)) {
            const result = {
                id: url.searchParams.get(pattern.idParam),
                idColumn: pattern.idColumn ?? "id",
                rectypeValue: pattern.rectypeParam
                    ? url.searchParams.get(pattern.rectypeParam)
                    : null,
                lookupTables: pattern.lookupTables ?? [],
                staticTable: pattern.staticTable ?? null,
                relatedTables: pattern.relatedTables ?? [],
            };
            debugLog("SuiteQL", "Matched URL pattern:", pattern.pathPattern, result);
            return result;
        }
    }

    // Default: try to get ID from standard 'id' parameter
    const defaultResult = {
        id: url.searchParams.get("id"),
        idColumn: "id",
        rectypeValue: null,
        lookupTables: [],
        staticTable: null,
        relatedTables: [],
    };
    debugLog("SuiteQL", "No URL pattern matched, using defaults:", defaultResult);
    return defaultResult;
};

/**
 * Fetch related records and return them keyed by their nest key
 */
const fetchRelatedRecords = async (
    primaryRecord: Record<string, unknown>,
    relatedTables: RelatedTable[]
): Promise<Record<string, Record<string, unknown> | Record<string, unknown>[] | null>> => {
    const related: Record<string, Record<string, unknown> | Record<string, unknown>[] | null> = {};

    for (const rel of relatedTables) {
        const foreignKeyValue = primaryRecord[rel.foreignKey];
        const nestKey = rel.nestKey ?? `_${rel.table}`;

        if (foreignKeyValue === null || foreignKeyValue === undefined) {
            debugLog("SuiteQL", `Skipping related table ${rel.table}: foreign key ${rel.foreignKey} is null`);
            related[nestKey] = null;
            continue;
        }

        const query = `SELECT * FROM ${rel.table} WHERE ${rel.matchColumn} = '${foreignKeyValue}'`;
        debugLog("SuiteQL", "Fetching related record:", query);

        const { data, error } = await fetchQuery<Record<string, unknown>>(query);

        if (error) {
            debugLog("SuiteQL", `Error fetching related ${rel.table}:`, error);
            related[nestKey] = null;
            continue;
        }

        if (data && data.length > 0) {
            if (rel.multiple) {
                debugLog("SuiteQL", `Found ${data.length} related ${rel.table} records`);
                related[nestKey] = data;
            } else {
                debugLog("SuiteQL", `Found related ${rel.table}:`, data[0]);
                related[nestKey] = data[0];
            }
        } else {
            debugLog("SuiteQL", `No related ${rel.table} found for ${rel.foreignKey}=${foreignKeyValue}`);
            related[nestKey] = rel.multiple ? [] : null;
        }
    }

    return related;
};

/**
 * Get the SuiteQL table name for a record type by querying lookup tables
 */
const getTableName = async (
    recordType: string,
    urlInfo: ParsedUrlInfo
): Promise<{ tableName: string | null; error: string | null }> => {
    debugLog("SuiteQL", "getTableName called with:", { recordType, urlInfo });

    // If we have a static table from URL pattern, use it
    if (urlInfo.staticTable) {
        debugLog("SuiteQL", "Using static table:", urlInfo.staticTable);
        return { tableName: urlInfo.staticTable, error: null };
    }

    // If we have lookup tables and a rectype value from URL, query them
    if (urlInfo.lookupTables.length > 0 && urlInfo.rectypeValue) {
        debugLog("SuiteQL", "Looking up table name from URL rectype:", urlInfo.rectypeValue);
        for (const lookup of urlInfo.lookupTables) {
            const query = `SELECT ${lookup.tableNameColumn} FROM ${lookup.lookupTable} WHERE ${lookup.matchColumn} = '${urlInfo.rectypeValue}'`;
            debugLog("SuiteQL", "Lookup query:", query);
            const { data, error } = await fetchQuery<Record<string, string>>(query);

            if (error) {
                debugLog("SuiteQL", "Lookup query failed:", error);
                // Continue to next lookup table if this one fails
                continue;
            }

            debugLog("SuiteQL", "Lookup query result:", data);
            if (data && data.length > 0) {
                const tableName = data[0][lookup.tableNameColumn];
                if (tableName) {
                    debugLog("SuiteQL", "Found table name:", tableName);
                    return { tableName, error: null };
                }
            }
        }

        return {
            tableName: null,
            error: `Could not resolve table name from lookup tables for rectype: ${urlInfo.rectypeValue}`,
        };
    }

    // For standard records or custom records where we got the type from currentRecord module,
    // the record type is typically the table name (e.g., "customer", "customrecord_xxx")
    // Some record types have different SuiteQL table names - check the mapping first
    if (recordType) {
        const mappedTable = RECORD_TYPE_TO_TABLE[recordType] ?? recordType;
        debugLog("SuiteQL", "Using recordType as table name:", recordType, "->", mappedTable);
        return { tableName: mappedTable, error: null };
    }

    // Special case: we're on a custom record URL but don't have rectype param or recordType
    // This can happen when the URL doesn't include rectype and currentRecord module isn't available
    if (urlInfo.lookupTables.length > 0 && !urlInfo.rectypeValue) {
        debugLog(
            "SuiteQL",
            "On custom record page without rectype param - need currentRecord module"
        );
        return {
            tableName: null,
            error: "Custom record page detected but could not determine record type. The currentRecord module may not be available.",
        };
    }

    debugLog("SuiteQL", "Could not determine table name - no rectype value and no recordType");
    return { tableName: null, error: "Could not determine table name" };
};

export const SuiteQLRecordDetail = ({
    searchTerm,
    forceExpanded,
    showEmptyFields = false,
    onRecordInfoChange,
    onRecordChange,
}: SuiteQLRecordDetailProps) => {
    const [record, setRecord] = useState<Record<string, unknown> | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [recordInfo, setRecordInfo] = useState<{
        id: string | null;
        idColumn: string;
        type: string | null;
    }>({
        id: null,
        idColumn: "id",
        type: null,
    });

    const {
        recordInfo: currentRecordInfo,
        loading: currentRecordLoading,
        error: currentRecordError,
    } = useCurrentRecord();

    const loadRecord = useCallback(async () => {
        debugLog("SuiteQL", "loadRecord started, currentRecordInfo:", currentRecordInfo);
        setLoading(true);
        setError(null);

        try {
            // Parse URL for record information
            const urlInfo = parseRecordFromUrl();

            let recordId: string | null = urlInfo.id;
            let recordType: string | null = null;
            let idColumn = urlInfo.idColumn;

            // Try to get record info from currentRecord module (via postMessage bridge)
            if (currentRecordInfo) {
                debugLog("SuiteQL", "currentRecord info from bridge:", currentRecordInfo);
                if (currentRecordInfo.id) {
                    recordId = recordId || String(currentRecordInfo.id);
                }
                if (currentRecordInfo.type) {
                    recordType = currentRecordInfo.type;
                }
            } else if (currentRecordError) {
                debugLog("SuiteQL", "currentRecord bridge error:", currentRecordError);
            }

            debugLog("SuiteQL", "Record info after currentRecord check:", { recordId, recordType });

            // If we don't have a static table from URL patterns and no recordType yet,
            // fall back to fetching record info from XML
            if (!urlInfo.staticTable && !recordType) {
                debugLog("SuiteQL", "No URL pattern match or recordType, falling back to XML");
                const xmlInfo = await fetchRecordInfoFromXml();
                if (xmlInfo.recordType && xmlInfo.id) {
                    recordType = xmlInfo.recordType;
                    recordId = recordId || xmlInfo.id;
                    // When using XML fallback, use 'internalid' as the column (most common in SuiteQL)
                    idColumn = "id";
                    debugLog("SuiteQL", "Got record info from XML:", { recordType, recordId });
                } else if (xmlInfo.error) {
                    debugLog("SuiteQL", "XML fallback failed:", xmlInfo.error);
                }
            }

            if (!recordId) {
                setError("Could not determine record ID. Are you on a record page?");
                setLoading(false);
                return;
            }

            // Determine the table name
            const { tableName, error: tableError } = await getTableName(recordType || "", urlInfo);

            if (tableError || !tableName) {
                setError(tableError || "Could not determine table name for this record type");
                setLoading(false);
                return;
            }

            setRecordInfo({ id: recordId, idColumn, type: tableName });
            onRecordInfoChange?.({ recordType: tableName, id: recordId });

            // Execute the SuiteQL query using the appropriate ID column
            const query = `SELECT * FROM ${tableName} WHERE ${idColumn} = '${recordId}'`;
            debugLog("SuiteQL", "Executing query:", query);
            const { data, error: queryError } = await fetchQuery<Record<string, unknown>>(query);

            if (queryError) {
                debugLog("SuiteQL", "Query error:", queryError);
                setError(`SuiteQL Error: ${queryError}`);
                setLoading(false);
                return;
            }

            debugLog("SuiteQL", "Query result:", data);
            if (!data || data.length === 0) {
                setError(`No record found with ID ${recordId} in table ${tableName}`);
                setLoading(false);
                return;
            }

            let finalRecord = data[0];

            // Fetch related records if configured
            if (urlInfo.relatedTables.length > 0) {
                const relatedRecords = await fetchRelatedRecords(finalRecord, urlInfo.relatedTables);
                finalRecord = { ...finalRecord, ...relatedRecords };
            }

            setRecord(finalRecord);
            onRecordChange?.(finalRecord);
        } catch (err) {
            debugLog("SuiteQL", "Unexpected error:", err);
            setError(err instanceof Error ? err.message : "An unknown error occurred");
        }

        setLoading(false);
    }, [currentRecordInfo, currentRecordError, onRecordChange, onRecordInfoChange]);

    useEffect(() => {
        // Only load when the currentRecord hook has finished loading
        if (!currentRecordLoading) {
            loadRecord(); // eslint-disable-line react-hooks/set-state-in-effect
        }
    }, [currentRecordLoading, loadRecord]);

    // Separate main fields from related tables (keys starting with _) and sort alphabetically
    const { mainFields, relatedTables } = useMemo(() => {
        if (!record) return { mainFields: null, relatedTables: {} };

        const mainEntries: [string, unknown][] = [];
        const relatedEntries: [string, unknown][] = [];

        for (const [key, value] of Object.entries(record)) {
            if (key.startsWith("_")) {
                relatedEntries.push([key, sortObjectKeys(value)]);
            } else {
                mainEntries.push([key, value]);
            }
        }

        // Sort both alphabetically by key
        mainEntries.sort((a, b) => a[0].localeCompare(b[0]));
        relatedEntries.sort((a, b) => a[0].localeCompare(b[0]));

        return {
            mainFields: Object.fromEntries(mainEntries),
            relatedTables: Object.fromEntries(relatedEntries),
        };
    }, [record]);

    // Filter main fields based on search term and showEmptyFields
    const filteredMainFields = useMemo(() => {
        if (!mainFields) return mainFields;

        const term = searchTerm?.toUpperCase() || "";
        const filtered: Record<string, unknown> = {};

        for (const [key, value] of Object.entries(mainFields)) {
            // Filter out empty fields if showEmptyFields is false
            if (!showEmptyFields && (value === null || value === undefined || value === "")) {
                continue;
            }

            // If no search term, include field (subject to empty filter above)
            if (!searchTerm) {
                filtered[key] = value;
                continue;
            }

            const keyMatches = key.toUpperCase().includes(term);
            const valueMatches =
                value !== null &&
                value !== undefined &&
                String(value).toUpperCase().includes(term);

            if (keyMatches || valueMatches) {
                filtered[key] = value;
            }
        }

        return filtered;
    }, [mainFields, searchTerm, showEmptyFields]);

    // Filter related tables based on search term (search within nested records)
    const filteredRelatedTables = useMemo(() => {
        if (!relatedTables || !searchTerm) return relatedTables;

        const term = searchTerm.toUpperCase();
        const filtered: Record<string, unknown> = {};

        for (const [key, value] of Object.entries(relatedTables)) {
            // Always include related tables, but filter their contents
            if (Array.isArray(value)) {
                const filteredArray = value.filter((item) => {
                    if (typeof item !== "object" || item === null) return false;
                    return Object.entries(item).some(([k, v]) => {
                        const keyMatches = k.toUpperCase().includes(term);
                        const valueMatches =
                            v !== null && v !== undefined && String(v).toUpperCase().includes(term);
                        return keyMatches || valueMatches;
                    });
                });
                // Include if there are matches or if no search term
                if (filteredArray.length > 0 || !searchTerm) {
                    filtered[key] = searchTerm ? filteredArray : value;
                }
            } else if (typeof value === "object" && value !== null) {
                const hasMatch = Object.entries(value).some(([k, v]) => {
                    const keyMatches = k.toUpperCase().includes(term);
                    const valueMatches =
                        v !== null && v !== undefined && String(v).toUpperCase().includes(term);
                    return keyMatches || valueMatches;
                });
                if (hasMatch || !searchTerm) {
                    filtered[key] = value;
                }
            } else {
                filtered[key] = value;
            }
        }

        return filtered;
    }, [relatedTables, searchTerm]);

    if (loading) {
        return (
            <div className="plasmo:flex plasmo:items-center plasmo:justify-center plasmo:h-32">
                <Spinner className="plasmo:size-8" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="plasmo:flex plasmo:flex-col plasmo:items-center plasmo:justify-center plasmo:h-32 plasmo:text-destructive plasmo:gap-2">
                <AlertCircle className="plasmo:size-8" />
                <span className="plasmo:text-center plasmo:px-4">{error}</span>
                <span className="plasmo:text-muted-foreground plasmo:text-sm">
                    SuiteQL may not support all record types
                </span>
            </div>
        );
    }

    if (!filteredMainFields) {
        return null;
    }

    return (
        <div>
            {recordInfo.type && recordInfo.id && (
                <div className="plasmo:mb-2 plasmo:text-muted-foreground plasmo:text-sm plasmo:flex plasmo:items-center plasmo:gap-2">
                    <code>
                        SELECT * FROM {recordInfo.type} WHERE {recordInfo.idColumn} = &apos;
                        {recordInfo.id}&apos;
                    </code>
                    <CopyButton
                        value={`SELECT * FROM ${recordInfo.type} WHERE ${recordInfo.idColumn} = '${recordInfo.id}'`}
                        className="plasmo:size-5"
                        title="Copy query"
                    />
                </div>
            )}
            <JsonNode
                name="fields"
                value={filteredMainFields}
                searchTerm={searchTerm}
                defaultExpanded={true}
                forceExpanded={forceExpanded}
            />
            {Object.entries(filteredRelatedTables).map(([key, value]) => (
                <JsonNode
                    key={key}
                    name={key.replace(/^_/, "")}
                    value={value}
                    searchTerm={searchTerm}
                    defaultExpanded={false}
                    forceExpanded={forceExpanded}
                />
            ))}
        </div>
    );
};
