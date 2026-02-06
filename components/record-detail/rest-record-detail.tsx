import { JsonNode } from "@/components/record-detail/json-node";
import { parseNextUrl } from "@/components/record-detail/url-patterns";
import { Spinner } from "@/components/ui/spinner";
import { AlertCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { debugLog } from "~lib/debug";
import { useCurrentRecord } from "~lib/hooks/use-current-record";

interface RestRecordDetailProps {
    searchTerm: string;
    forceExpanded?: boolean;
    showEmptyFields?: boolean;
    /** Record type from XML/currentRecord (used on classic pages) */
    xmlRecordType?: string | null;
    /** Record ID from XML/currentRecord (used on classic pages) */
    xmlRecordId?: string | null;
    onRecordInfoChange?: (info: { recordType: string | null; id: string | null }) => void;
    onRecordChange?: (record: Record<string, unknown> | null) => void;
}

/**
 * Parse a classic NetSuite URL for the record ID.
 * Classic URLs use ?id=123 query parameter.
 */
const parseClassicUrlId = (): string | null => {
    return new URL(window.location.href).searchParams.get("id");
};

/**
 * Fetch a record from the NetSuite REST API.
 * Uses /services/rest/record/v1/{recordType}/{id}
 */
const fetchRestRecord = async (
    recordType: string,
    id: string
): Promise<{ data: Record<string, unknown> | null; error: string | null }> => {
    const url = `/services/rest/record/v1/${recordType}/${id}?expandSubResources=true`;
    debugLog("REST", "Fetching:", url);

    try {
        const response = await fetch(url, {
            headers: {
                Accept: "application/json",
            },
        });

        if (!response.ok) {
            const text = await response.text();
            let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            try {
                const errorJson = JSON.parse(text);
                if (errorJson?.["o:errorDetails"]?.[0]?.detail) {
                    errorMessage = errorJson["o:errorDetails"][0].detail;
                } else if (errorJson?.title) {
                    errorMessage = errorJson.title;
                }
            } catch {
                // Use the default error message
            }
            return { data: null, error: errorMessage };
        }

        const json = await response.json();
        debugLog("REST", "Response:", json);
        return { data: json, error: null };
    } catch (err) {
        return {
            data: null,
            error: err instanceof Error ? err.message : "Unknown error fetching REST record",
        };
    }
};

/**
 * Flatten REST API response into a simpler key-value structure.
 * The REST API returns objects with nested { links, ... } for relationships
 * and wraps sublists in { items: [...], ... } structures.
 */
const flattenRestRecord = (record: Record<string, unknown>): Record<string, unknown> => {
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(record)) {
        // Skip metadata keys
        if (key === "links" || key === "o:errorDetails") {
            continue;
        }

        if (value !== null && typeof value === "object" && !Array.isArray(value)) {
            const obj = value as Record<string, unknown>;
            // Sublist with items array
            if ("items" in obj && Array.isArray(obj.items)) {
                result[`_${key}`] = (obj.items as Record<string, unknown>[]).map((item) => {
                    const flatItem: Record<string, unknown> = {};
                    for (const [k, v] of Object.entries(item)) {
                        if (k === "links") continue;
                        flatItem[k] = v;
                    }
                    return flatItem;
                });
            } else if ("links" in obj && Object.keys(obj).length <= 2) {
                // Reference field with just links and maybe an id - skip or show id
                if ("id" in obj) {
                    result[key] = obj.id;
                }
            } else {
                // Nested object - flatten recursively but keep it nested
                result[key] = flattenRestRecord(obj);
            }
        } else {
            result[key] = value;
        }
    }

    return result;
};

export const RestRecordDetail = ({
    searchTerm,
    forceExpanded,
    showEmptyFields = false,
    xmlRecordType,
    xmlRecordId,
    onRecordInfoChange,
    onRecordChange,
}: RestRecordDetailProps) => {
    const [record, setRecord] = useState<Record<string, unknown> | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [recordInfo, setRecordInfo] = useState<{
        recordType: string | null;
        id: string | null;
    }>({ recordType: null, id: null });

    const { recordInfo: currentRecordInfo, loading: currentRecordLoading } = useCurrentRecord();

    const loadRecord = useCallback(async () => {
        setLoading(true);
        setError(null);

        let recordType: string | null = null;
        let id: string | null = null;

        // Try "Next" URL parsing first
        const nextInfo = parseNextUrl();
        if (nextInfo) {
            recordType = nextInfo.recordType;
            id = nextInfo.id;
        }

        // Fall back to XML/currentRecord info for classic pages
        if (!recordType && xmlRecordType) {
            recordType = xmlRecordType;
            id = xmlRecordId || parseClassicUrlId();
        }

        // Fall back to currentRecord module (via postMessage bridge)
        if (!recordType && currentRecordInfo?.type) {
            recordType = currentRecordInfo.type;
            id = currentRecordInfo.id ? String(currentRecordInfo.id) : parseClassicUrlId();
        }

        if (!recordType || !id) {
            setError("Could not determine record type. Are you on a record page?");
            setLoading(false);
            return;
        }

        setRecordInfo({ recordType, id });
        onRecordInfoChange?.({ recordType, id });

        const { data, error: fetchError } = await fetchRestRecord(recordType, id);

        if (fetchError) {
            setError(fetchError);
            setLoading(false);
            return;
        }

        if (!data) {
            setError("No data returned from REST API");
            setLoading(false);
            return;
        }

        const flattened = flattenRestRecord(data);
        setRecord(flattened);
        onRecordChange?.(flattened);
        setLoading(false);
    }, [xmlRecordType, xmlRecordId, currentRecordInfo, onRecordInfoChange, onRecordChange]);

    useEffect(() => {
        if (!currentRecordLoading) {
            loadRecord(); // eslint-disable-line react-hooks/set-state-in-effect
        }
    }, [currentRecordLoading, loadRecord]);

    // Separate main fields from sublists (keys starting with _) and sort alphabetically
    const { mainFields, sublists } = useMemo(() => {
        if (!record) return { mainFields: null, sublists: {} };

        const mainEntries: [string, unknown][] = [];
        const sublistEntries: [string, unknown][] = [];

        for (const [key, value] of Object.entries(record)) {
            if (key.startsWith("_")) {
                sublistEntries.push([key, value]);
            } else {
                mainEntries.push([key, value]);
            }
        }

        mainEntries.sort((a, b) => a[0].localeCompare(b[0]));
        sublistEntries.sort((a, b) => a[0].localeCompare(b[0]));

        return {
            mainFields: Object.fromEntries(mainEntries),
            sublists: Object.fromEntries(sublistEntries),
        };
    }, [record]);

    // Filter main fields based on search term and showEmptyFields
    const filteredMainFields = useMemo(() => {
        if (!mainFields) return mainFields;

        const term = searchTerm?.toUpperCase() || "";
        const filtered: Record<string, unknown> = {};

        for (const [key, value] of Object.entries(mainFields)) {
            if (!showEmptyFields && (value === null || value === undefined || value === "")) {
                continue;
            }

            if (!searchTerm) {
                filtered[key] = value;
                continue;
            }

            const keyMatches = key.toUpperCase().includes(term);
            const valueMatches =
                value !== null && value !== undefined && String(value).toUpperCase().includes(term);

            if (keyMatches || valueMatches) {
                filtered[key] = value;
            }
        }

        return filtered;
    }, [mainFields, searchTerm, showEmptyFields]);

    // Filter sublists based on search term
    const filteredSublists = useMemo(() => {
        if (!sublists || !searchTerm) return sublists;

        const term = searchTerm.toUpperCase();
        const filtered: Record<string, unknown> = {};

        for (const [key, value] of Object.entries(sublists)) {
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
                if (filteredArray.length > 0) {
                    filtered[key] = filteredArray;
                }
            } else {
                filtered[key] = value;
            }
        }

        return filtered;
    }, [sublists, searchTerm]);

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
                    REST API may not support all record types
                </span>
            </div>
        );
    }

    if (!filteredMainFields) {
        return null;
    }

    return (
        <div>
            {recordInfo.recordType && recordInfo.id && (
                <div className="plasmo:mb-2 plasmo:text-muted-foreground plasmo:text-sm">
                    <code>
                        /services/rest/record/v1/{recordInfo.recordType}/{recordInfo.id}
                    </code>
                </div>
            )}
            <JsonNode
                name="fields"
                value={filteredMainFields}
                searchTerm={searchTerm}
                defaultExpanded={true}
                forceExpanded={forceExpanded}
            />
            {Object.entries(filteredSublists).map(([key, value]) => (
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
