import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
    AlertCircle,
    ChevronDown,
    ChevronRight,
    ChevronsDownUp,
    ChevronsUpDown,
    ExternalLink,
} from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

interface RecordDetailProps {
    setIsOpen: (open: boolean) => void;
}

interface ParsedRecord {
    recordType: string | null;
    id: string | null;
    bodyFields: Record<string, unknown>;
    lineFields: Record<string, unknown[]>;
    allFieldNames: string[];
    sublistFieldNames: Record<string, string[]>;
}

/**
 * Parse XML string to a JSON-like object
 */
const parseXmlToJson = (xmlString: string): Record<string, unknown> | null => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "text/xml");

    const parseError = xmlDoc.querySelector("parsererror");
    if (parseError) {
        console.error("XML Parse Error:", parseError.textContent);
        return null;
    }

    const xmlToJson = (node: Element): unknown => {
        const obj: Record<string, unknown> = {};

        // Add attributes with underscore prefix
        if (node.attributes) {
            for (const attr of Array.from(node.attributes)) {
                obj[`_${attr.name}`] = attr.value;
            }
        }

        // Process child nodes
        for (const child of Array.from(node.childNodes)) {
            if (child.nodeType === Node.TEXT_NODE) {
                const text = child.textContent?.trim();
                if (text) {
                    // If there are attributes, add text as _text, otherwise return just the text
                    if (Object.keys(obj).length > 0) {
                        obj._text = text;
                    } else {
                        return text;
                    }
                }
            } else if (child.nodeType === Node.ELEMENT_NODE) {
                const childElement = child as Element;
                const childName = childElement.nodeName;
                const childValue = xmlToJson(childElement);

                if (obj[childName] !== undefined) {
                    // Convert to array if multiple elements with same name
                    if (!Array.isArray(obj[childName])) {
                        obj[childName] = [obj[childName]];
                    }
                    (obj[childName] as unknown[]).push(childValue);
                } else {
                    obj[childName] = childValue;
                }
            }
        }

        return Object.keys(obj).length > 0 ? obj : "";
    };

    return xmlToJson(xmlDoc.documentElement) as Record<string, unknown>;
};

/**
 * Format the parsed XML into a more readable structure
 */
const formatRecord = (object: Record<string, unknown> | null): ParsedRecord | null => {
    if (!object) return null;

    // The root element is nsResponse, so xmlToJson returns its contents directly
    // which means object = { record: { ... } } (not { nsResponse: { record: { ... } } })
    const record = object.record as Record<string, unknown> | undefined;

    if (!record) {
        return null;
    }

    // Parse all field names from the _fields attribute
    const fieldsAttr = record._fields as string | undefined;
    const allFieldNames = fieldsAttr ? fieldsAttr.split(",").map((f) => f.trim()) : [];

    const result: ParsedRecord = {
        recordType: null,
        id: null,
        bodyFields: {},
        lineFields: {},
        allFieldNames,
        sublistFieldNames: {},
    };

    for (const [key, value] of Object.entries(record)) {
        switch (key) {
            case "machine": {
                // Handle sublists/line items
                const machines = Array.isArray(value) ? value : [value];
                for (const sublist of machines) {
                    const sublistObj = sublist as Record<string, unknown>;
                    const name = sublistObj._name as string;
                    if (name) {
                        // Capture sublist field names from _fields attribute
                        const sublistFieldsAttr = sublistObj._fields as string | undefined;
                        if (sublistFieldsAttr) {
                            result.sublistFieldNames[name] = sublistFieldsAttr
                                .split(",")
                                .map((f) => f.trim());
                        }

                        if (sublistObj.line) {
                            result.lineFields[name] = Array.isArray(sublistObj.line)
                                ? sublistObj.line
                                : [sublistObj.line];
                        } else {
                            // Show empty sublists too
                            result.lineFields[name] = [];
                        }
                    }
                }
                break;
            }
            case "_recordType":
                result.recordType = value as string;
                break;
            case "_id":
                result.id = value as string;
                break;
            case "_fields":
                // Already processed above
                break;
            default:
                result.bodyFields[key] = value;
        }
    }

    return result;
};

/**
 * Filter record based on search term
 */
const filterRecord = (object: ParsedRecord, searchTerm: string): ParsedRecord => {
    const term = searchTerm.toUpperCase();

    const deepFilter = (obj: Record<string, unknown>): Record<string, unknown> => {
        const result: Record<string, unknown> = {};

        for (const [key, value] of Object.entries(obj)) {
            if (typeof value !== "object" || value === null) {
                const keyMatches = key.toString().toUpperCase().includes(term);
                const valueMatches =
                    value !== null &&
                    value !== undefined &&
                    value.toString().toUpperCase().includes(term);

                if (keyMatches || valueMatches) {
                    result[key] = value;
                }
            } else if (Array.isArray(value)) {
                const filtered = value
                    .map((item) =>
                        typeof item === "object" && item !== null
                            ? deepFilter(item as Record<string, unknown>)
                            : item
                    )
                    .filter((item) =>
                        typeof item === "object" ? Object.keys(item as object).length > 0 : true
                    );
                if (filtered.length > 0) {
                    result[key] = filtered;
                }
            } else {
                const filtered = deepFilter(value as Record<string, unknown>);
                if (Object.keys(filtered).length > 0) {
                    result[key] = filtered;
                }
            }
        }

        return result;
    };

    return {
        recordType: object.recordType,
        id: object.id,
        bodyFields: deepFilter(object.bodyFields),
        lineFields: deepFilter(object.lineFields) as Record<string, unknown[]>,
        allFieldNames: object.allFieldNames,
        sublistFieldNames: object.sublistFieldNames,
    };
};

/**
 * Collapsible JSON node component
 */
const JsonNode = ({
    name,
    value,
    searchTerm,
    defaultExpanded = false,
    forceExpanded,
}: {
    name?: string;
    value: unknown;
    searchTerm: string;
    defaultExpanded?: boolean;
    forceExpanded?: boolean;
}) => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    // Sync with forceExpanded when it changes
    useEffect(() => {
        if (forceExpanded !== undefined) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setIsExpanded(forceExpanded);
        }
    }, [forceExpanded]);

    const highlightMatch = (text: string): React.ReactNode => {
        if (!searchTerm) return text;

        const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
        const parts = text.split(regex);

        return parts.map((part, i) =>
            regex.test(part) ? (
                <span key={i} className="plasmo:bg-yellow-500/50 plasmo:rounded plasmo:px-0.5">
                    {part}
                </span>
            ) : (
                part
            )
        );
    };

    if (value === null || value === undefined) {
        return (
            <div className="plasmo:flex plasmo:items-center plasmo:gap-1 plasmo:py-px!">
                {name && <span className="plasmo:text-black plasmo:dark:text-purple-400">{highlightMatch(name)}:</span>}
                <span className="plasmo:text-rose-700 plasmo:dark:text-red-400 plasmo:italic">null</span>
            </div>
        );
    }

    if (typeof value !== "object") {
        const stringValue = String(value);
        return (
            <div className="plasmo:flex plasmo:items-start plasmo:gap-1 plasmo:py-px!">
                {name && (
                    <span className="plasmo:text-black plasmo:dark:text-purple-400 plasmo:shrink-0">
                        {highlightMatch(name)}:
                    </span>
                )}
                <span className="plasmo:text-emerald-700 plasmo:dark:text-green-400 plasmo:whitespace-nowrap">
                    {highlightMatch(stringValue)}
                </span>
            </div>
        );
    }

    const isArray = Array.isArray(value);
    const entries = isArray
        ? (value as unknown[]).map((v, i) => [String(i), v] as [string, unknown])
        : Object.entries(value as Record<string, unknown>);
    const isEmpty = entries.length === 0;

    if (isEmpty) {
        return (
            <div className="plasmo:flex plasmo:items-center plasmo:gap-1 plasmo:py-px!">
                {name && <span className="plasmo:text-black plasmo:dark:text-purple-400">{highlightMatch(name)}:</span>}
                <span className="plasmo:text-muted-foreground">{isArray ? "[]" : "{}"}</span>
            </div>
        );
    }

    return (
        <div className="plasmo:flex plasmo:flex-col">
            <div className="plasmo:flex plasmo:items-center plasmo:group plasmo:flex-row plasmo:gap-2">
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="plasmo:flex plasmo:items-center plasmo:gap-1 plasmo:py-px! plasmo:cursor-pointer plasmo:hover:bg-white/5 plasmo:rounded plasmo:text-left"
                >
                    {isExpanded ? (
                        <ChevronDown className="plasmo:size-4 plasmo:shrink-0" />
                    ) : (
                        <ChevronRight className="plasmo:size-4 plasmo:shrink-0" />
                    )}
                    {name && <span className="plasmo:text-black plasmo:dark:text-purple-400">{highlightMatch(name)}</span>}
                    <span className="plasmo:text-muted-foreground plasmo:text-sm">
                        {isArray ? `[${entries.length}]` : `{${entries.length}}`}
                    </span>
                </button>
                <CopyButton
                    value={JSON.stringify(value, null, 2)}
                    className="plasmo:size-6 plasmo:opacity-0 plasmo:group-hover:opacity-100 plasmo:transition-opacity"
                    title={`Copy ${name || (isArray ? "array" : "object")}`}
                />
            </div>
            {isExpanded && (
                <div className="plasmo:ml-4! plasmo:pl-2! plasmo:border-l plasmo:border-gray-700">
                    {entries.map(([key, val]) => (
                        <JsonNode
                            key={key}
                            name={key}
                            value={val}
                            searchTerm={searchTerm}
                            defaultExpanded={!!searchTerm}
                            forceExpanded={forceExpanded}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

/**
 * Fetch record data from current page URL with &xml=T parameter
 */
const fetchRecordData = async (): Promise<{
    data: ParsedRecord | null;
    error: string | null;
}> => {
    try {
        const currentUrl = window.location.href;

        // Append &xml=T to get XML response
        const xmlUrl = currentUrl.includes("?") ? `${currentUrl}&xml=T` : `${currentUrl}?xml=T`;

        const response = await fetch(xmlUrl);

        if (!response.ok) {
            return { data: null, error: `HTTP ${response.status}: ${response.statusText}` };
        }

        const xmlText = await response.text();

        // Check if we got HTML instead of XML (not on a record page)
        if (xmlText.trim().startsWith("<!DOCTYPE") || xmlText.trim().startsWith("<html")) {
            return { data: null, error: "Not on a record page" };
        }

        const parsed = parseXmlToJson(xmlText);
        console.log("Parsed XML to JSON:", parsed);
        const formatted = formatRecord(parsed);
        console.log("Formatted record:", formatted);

        if (!formatted) {
            return { data: null, error: "Could not parse record data" };
        }

        return { data: formatted, error: null };
    } catch (err) {
        return {
            data: null,
            error: err instanceof Error ? err.message : "Unknown error occurred",
        };
    }
};

export const RecordDetail = ({ setIsOpen }: RecordDetailProps) => {
    const [record, setRecord] = useState<ParsedRecord | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [showEmptyFields, setShowEmptyFields] = useState(false);

    const loadRecord = useCallback(async () => {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await fetchRecordData();

        if (fetchError) {
            setError(fetchError);
        } else {
            setRecord(data);
        }

        setLoading(false);
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadRecord();
    }, [loadRecord]);

    const recordWithEmptyFields = useMemo(() => {
        if (!record || !showEmptyFields) return record;

        // Add empty fields from allFieldNames that don't exist in bodyFields
        const bodyFieldsWithEmpty = { ...record.bodyFields };
        for (const fieldName of record.allFieldNames) {
            if (!(fieldName in bodyFieldsWithEmpty) && !fieldName.startsWith("_")) {
                bodyFieldsWithEmpty[fieldName] = null;
            }
        }

        // Add empty fields to line items based on sublistFieldNames
        const lineFieldsWithEmpty: Record<string, unknown[]> = {};
        for (const [sublistName, lines] of Object.entries(record.lineFields)) {
            const sublistFields = record.sublistFieldNames[sublistName] || [];
            lineFieldsWithEmpty[sublistName] = lines.map((line) => {
                const lineObj = line as Record<string, unknown>;
                const lineWithEmpty = { ...lineObj };
                for (const fieldName of sublistFields) {
                    if (!(fieldName in lineWithEmpty) && !fieldName.startsWith("_")) {
                        lineWithEmpty[fieldName] = null;
                    }
                }
                return lineWithEmpty;
            });
        }

        return {
            ...record,
            bodyFields: bodyFieldsWithEmpty,
            lineFields: lineFieldsWithEmpty,
        };
    }, [record, showEmptyFields]);

    const filteredRecord = useMemo(() => {
        if (!recordWithEmptyFields || !searchTerm) return recordWithEmptyFields;
        return filterRecord(recordWithEmptyFields, searchTerm);
    }, [recordWithEmptyFields, searchTerm]);

    const [forceExpanded, setForceExpanded] = useState<boolean | undefined>(undefined);

    const expandAll = useCallback(() => setForceExpanded(true), []);
    const collapseAll = useCallback(() => setForceExpanded(false), []);

    const recordsCatalogUrl = record?.recordType
        ? `https://system.netsuite.com/app/recordscatalog/rcbrowser.nl?whence=#/record_ss/${record.recordType}`
        : null;

    return (
        <div className="plasmo:text-foreground!">
            <Dialog open={true} onOpenChange={setIsOpen}>
                <DialogContent className="plasmo:z-1002 plasmo:text-foreground! plasmo:p-0! plasmo:w-[60vw]! plasmo:max-w-[60vw]! plasmo:min-h-[60vh] plasmo:max-h-[85vh] plasmo:flex plasmo:flex-col plasmo:gap-1">
                    <DialogHeader className="plasmo:px-4! plasmo:pt-4! plasmo:pb-2! plasmo:border-b plasmo:border-border">
                        <div className="plasmo:flex plasmo:items-center plasmo:justify-between">
                            <DialogTitle className="plasmo:flex plasmo:items-center plasmo:gap-2">
                                Record Detail
                                {record && (
                                    <span className="plasmo:text-muted-foreground plasmo:text-sm plasmo:font-normal">
                                        {record.recordType} #{record.id}
                                    </span>
                                )}
                            </DialogTitle>
                            <div className="plasmo:flex plasmo:items-center plasmo:gap-1 plasmo:mr-8!">
                                <Button
                                    variant={showEmptyFields ? "secondary" : "ghost"}
                                    size="sm"
                                    onClick={() => setShowEmptyFields(!showEmptyFields)}
                                    className="plasmo:cursor-pointer plasmo:h-8"
                                >
                                    {showEmptyFields ? "Hide Empty" : "Show Empty"}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={expandAll}
                                    className="plasmo:cursor-pointer plasmo:size-8"
                                    title="Expand all"
                                >
                                    <ChevronsUpDown className="plasmo:size-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={collapseAll}
                                    className="plasmo:cursor-pointer plasmo:size-8"
                                    title="Collapse all"
                                >
                                    <ChevronsDownUp className="plasmo:size-4" />
                                </Button>
                                {recordsCatalogUrl && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        asChild
                                        className="plasmo:cursor-pointer plasmo:h-8"
                                    >
                                        <a
                                            href={recordsCatalogUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <ExternalLink className="plasmo:size-4 plasmo:mr-1" />
                                            Records Catalog
                                        </a>
                                    </Button>
                                )}
                                <CopyButton
                                    value={
                                        filteredRecord
                                            ? JSON.stringify(filteredRecord, null, 2)
                                            : ""
                                    }
                                    title="Copy JSON to clipboard"
                                />
                            </div>
                        </div>
                        {record && (
                            <div className="plasmo:pt-2!">
                                <Input
                                    type="text"
                                    placeholder="Search fields..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="plasmo:h-8"
                                    autoFocus
                                />
                            </div>
                        )}
                    </DialogHeader>

                    <div className="plasmo:flex-1 plasmo:overflow-y-auto plasmo:overflow-x-auto plasmo:px-4! plasmo:pb-4! plasmo:font-mono plasmo:text-sm">
                        {loading && (
                            <div className="plasmo:flex plasmo:items-center plasmo:justify-center plasmo:h-32">
                                <Spinner className="plasmo:size-8" />
                            </div>
                        )}

                        {error && (
                            <div className="plasmo:flex plasmo:flex-col plasmo:items-center plasmo:justify-center plasmo:h-32 plasmo:text-destructive plasmo:gap-2">
                                <AlertCircle className="plasmo:size-8" />
                                <span>{error}</span>
                                <span className="plasmo:text-muted-foreground plasmo:text-sm">
                                    Are you on a record page?
                                </span>
                            </div>
                        )}

                        {filteredRecord && !loading && !error && (
                            <div>
                                <JsonNode
                                    name="recordType"
                                    value={filteredRecord.recordType}
                                    searchTerm={searchTerm}
                                    forceExpanded={forceExpanded}
                                />
                                <JsonNode
                                    name="id"
                                    value={filteredRecord.id}
                                    searchTerm={searchTerm}
                                    forceExpanded={forceExpanded}
                                />
                                {Object.keys(filteredRecord.bodyFields).length > 0 && (
                                    <JsonNode
                                        name="bodyFields"
                                        value={filteredRecord.bodyFields}
                                        searchTerm={searchTerm}
                                        defaultExpanded={true}
                                        forceExpanded={forceExpanded}
                                    />
                                )}
                                {Object.keys(filteredRecord.lineFields).length > 0 && (
                                    <JsonNode
                                        name="lineFields"
                                        value={filteredRecord.lineFields}
                                        searchTerm={searchTerm}
                                        defaultExpanded={true}
                                        forceExpanded={forceExpanded}
                                    />
                                )}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};
