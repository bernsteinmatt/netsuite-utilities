import { Badge } from "@/components/ui/badge";
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandLoading,
    CommandSeparator,
} from "@/components/ui/command";
import { Code, ExternalLink, FileText, List, ScrollText, Terminal } from "lucide-react";
import * as React from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Spinner } from "~components/ui/spinner";
import {
    buildUberSearchUrl,
    escapeSqlString,
    fetchAutosuggest,
    fetchCustomRecordTypes,
    fetchNavMenuData,
    fetchPermissions,
    fetchQuery,
    getSearchableCustomRecordTypes,
    resolveRecordUrl,
    searchCustomRecordInstances,
    type AutosuggestResult,
    type CustomRecordInstance,
    type CustomRecordType,
    type FlatNavMenuItem,
    type Permissions,
} from "~lib/fetch-query";

import { Kbd, KbdGroup } from "~components/ui/kbd";

const isDev = process.env.NODE_ENV === "development";
const devLog = (...args: unknown[]) => {
    if (isDev) console.log(...args);
};

// Keyboard shortcut definitions for tools
export const TOOL_SHORTCUTS = {
    "sql-editor": { key: "U", modifiers: ["⌘", "⇧"] },
    "script-log-viewer": { key: "L", modifiers: ["⌘", "⇧"] },
    "command-search": { key: "K", modifiers: ["⌘", "⇧"] },
    "load-modules": { key: "M", modifiers: ["⌘", "⇧"] },
} as const;

const ShortcutDisplay = ({ tool }: { tool: keyof typeof TOOL_SHORTCUTS }) => {
    const shortcut = TOOL_SHORTCUTS[tool];
    return (
        <KbdGroup className="plasmo:ml-auto">
            {shortcut.modifiers.map((mod) => (
                <Kbd key={mod}>{mod}</Kbd>
            ))}
            <Kbd>{shortcut.key}</Kbd>
        </KbdGroup>
    );
};

const defaultEntityValues = {
    textFields: ["entityId", "entityTitle"],
    urlBase: "/app/common/entity/entity.nl",
};

// Navigation prefixes (not part of mapping since nav items come from a different source)
const navPrefixes = ["nav", "menu", "navigation"];

const mapping = {
    account: {
        prefix: "acc",
        table: "account",
        selectColumns: ["id", "accountSearchDisplayName AS label"],
        textFields: ["id", "accountSearchDisplayName", "displayNameWithHierarchy"],
        description: "Account",
        urlBase: "/app/accounting/account/account.nl",
        listUrl: "/app/accounting/account/accounts.nl",
        listLabel: "Chart of Accounts",
    },
    customer: {
        prefix: "cus",
        table: "customer",
        selectColumns: ["id", "entityTitle AS label", "'customer' AS recordType"],
        textFields: ["entityId", "entityTitle"],
        whereClause: ["customer.isinactive = 'F'", "customer.searchStage = 'Customer'"],
        description: "Customer",
        urlBase: "/app/common/entity/custjob.nl",
        listUrl: "/app/common/entity/custjoblist.nl",
        listLabel: "Customers",
    },
    vendor: {
        prefix: "ven",
        table: "vendor",
        selectColumns: ["id", "entityTitle AS label", "'vendor' AS recordType"],
        textFields: ["entityId", "entityTitle"],
        description: "Vendor",
        urlBase: "/app/common/entity/vendor.nl",
        listUrl: "/app/common/entity/vendorlist.nl",
        listLabel: "Vendors",
    },
    employee: {
        prefix: "emp",
        table: "employee",
        textFields: ["entityId", "( firstName || ' ' || lastName )"],
        selectColumns: [
            "id",
            "( firstName || ' ' || lastName ) AS label",
            "'employee' AS recordType",
        ],
        description: "Employee",
        urlBase: "/app/common/entity/employee.nl",
        listUrl: "/app/common/entity/employeelist.nl",
        listLabel: "Employees",
    },
    entity: {
        prefix: "entity",
        table: "entity",
        textFields: ["entityId", "entityTitle"],
        selectColumns: [
            "id",
            "entityTitle AS label",
            `'${defaultEntityValues.urlBase}' AS urlBase`,
        ],
        ...defaultEntityValues,
    },
    transaction: {
        prefix: "tran",
        table: `transaction 
        INNER JOIN transactionLine AS mainLine ON (
        transaction.id = mainLine.transaction
        AND mainLine.mainLine = 'T'
    )`,
        textFields: ["tranId"],
        selectColumns: [
            "transaction.id",
            "BUILTIN.DF (transaction.type) AS description",
            `COALESCE(transaction.tranid, TO_CHAR (transaction.id)) || CASE
             WHEN mainLine.entity IS NOT NULL THEN (' (' || BUILTIN.DF (mainLine.entity) || ')')
             ELSE ''
             END AS label`,
            "transaction.recordType",
            // "'/app/accounting/transactions/' || LOWER(transaction.type) || '.nl' AS urlbase",
        ],
        urlBase: "/app/accounting/transactions/transaction.nl",
    },
    script: {
        prefix: "script",
        table: "script",
        textFields: ["name"],
        selectColumns: ["id", "name AS label", "scriptType AS description"],
        urlBase: "/app/common/scripting/script.nl",
        description: "Script",
        listUrl: "/app/common/scripting/scriptlist.nl",
        listLabel: "Scripts",
    },
    customRecordDefinition: {
        prefix: "cr",
        table: "CustomRecordType",
        textFields: ["scriptid", "name"],
        selectColumns: ["scriptid", "name AS label", "internalid AS id"],
        urlBase: "/app/common/custom/custrecord.nl",
        listUrlBase: "/app/common/custom/custrecordentrylist.nl",
        description: "Custom Record",
        listUrl: "/app/common/custom/custrecords.nl",
        listLabel: "Custom Records",
    },
    customListDefinition: {
        prefix: "cl",
        table: "customList",
        textFields: ["scriptid", "name"],
        selectColumns: ["scriptid", "name AS label", "internalid AS id"],
        description: "Custom List",
        urlBase: "/app/common/custom/custlist.nl",
        listUrl: "/app/common/custom/custlists.nl",
        listLabel: "Custom Lists",
    },
};

// Derive record lists from mappings
const recordLists = Object.entries(mapping)
    .filter(([, m]) => "listUrl" in m && "listLabel" in m)
    .map(([key, m]) => ({
        id: key,
        label: (m as { listLabel: string }).listLabel,
        url: (m as { listUrl: string }).listUrl,
        description: (m as { description?: string }).description,
    }));

const MAX_NAV_RESULTS = 15;
const MAX_QUERY_RESULTS = 15;
const MAX_AUTOSUGGEST_RESULTS = 25;

const buildSuiteQLQuery = ({ query, type: typeMap }) => {
    const cleanedText = escapeSqlString(query);

    const textFieldConditions = typeMap.textFields
        .map((fieldId: string) => {
            if (cleanedText.includes("%")) {
                return `LOWER(${fieldId}) LIKE LOWER('${cleanedText}')`;
            }
            return `LOWER(${fieldId}) LIKE LOWER('%${cleanedText}%')`;
        })
        .join(" OR ");

    // Combine text field search with any additional where clauses
    const whereConditions = [`(${textFieldConditions})`];
    if (typeMap.whereClause?.length) {
        whereConditions.push(...typeMap.whereClause);
    }

    const columns = typeMap.selectColumns.join(",");
    const where = whereConditions.join(" AND ");

    const sql = `SELECT DISTINCT ${columns} FROM ${typeMap.table} WHERE ${where}`;

    devLog(sql);

    return sql;
};
export type ToolType = "sql-editor" | "script-log-viewer" | "load-modules";

interface CommandSearchProps {
    setIsOpen: (open: boolean) => void;
    onOpenTool?: (tool: ToolType) => void;
}

export const CommandSearch = ({ setIsOpen, onOpenTool }: CommandSearchProps) => {
    const [inputValue, setInputValue] = useState("");
    const [queriedData, setQueriedData] = useState([]);
    const timeoutRef = useRef(null);
    const [isFetching, setIsFetching] = useState(false);
    const requestIdRef = useRef(0);
    const [navMenuItems, setNavMenuItems] = useState<FlatNavMenuItem[]>([]);
    const [permissions, setPermissions] = useState<Permissions | null>(null);
    const [customRecordTypes, setCustomRecordTypes] = useState<CustomRecordType[]>([]);
    const [customRecordInstances, setCustomRecordInstances] = useState<CustomRecordInstance[]>([]);
    const [autosuggestResults, setAutosuggestResults] = useState<AutosuggestResult[]>([]);

    // Get searchable custom record types based on permissions
    const searchableCustomRecordTypes = useMemo(
        () => getSearchableCustomRecordTypes(customRecordTypes, permissions),
        [customRecordTypes, permissions]
    );

    // Collect all URLs from other result sources to dedupe autosuggest
    const existingUrls = useMemo(() => {
        const urls = new Set<string>();

        // Add URLs from queriedData
        for (const row of queriedData) {
            if (row.urlBase && row.id) {
                const url = row.urlBase + `?id=${row.id}`;
                devLog("[dedupe] Adding queriedData URL:", url, row);
                urls.add(url);
            }
            if (row.listUrlBase && row.id) {
                const url = `${row.listUrlBase}?rectype=${row.id}`;
                devLog("[dedupe] Adding queriedData list URL:", url, row);
                urls.add(url);
            }
        }

        // Add URLs from custom record instances
        for (const instance of customRecordInstances) {
            const url = `/app/common/custom/custrecordentry.nl?rectype=${instance.recordtypeid}&id=${instance.id}`;
            devLog("[dedupe] Adding custom record instance URL:", url);
            urls.add(url);
        }

        devLog("[dedupe] All existing URLs:", Array.from(urls));
        return urls;
    }, [queriedData, customRecordInstances]);

    // Filter autosuggest results to remove duplicates and sort alphabetically
    const filteredAutosuggestResults = useMemo(() => {
        devLog(
            "[dedupe] Autosuggest results before filter:",
            autosuggestResults.map((r) => ({ sname: r.sname, key: r.key }))
        );
        const filtered = autosuggestResults.filter((result) => {
            const isDupe = existingUrls.has(result.key);
            devLog("[dedupe] Checking autosuggest:", result.key, "isDupe:", isDupe);
            return !isDupe;
        });
        devLog(
            "[dedupe] Autosuggest results after filter:",
            filtered.map((r) => ({ sname: r.sname, key: r.key }))
        );
        return filtered.sort((a, b) => a.sname.localeCompare(b.sname));
    }, [autosuggestResults, existingUrls]);

    // Get search term for "See all results" link
    const currentSearchTerm = useMemo(() => {
        if (!inputValue) return "";
        return inputValue.includes(":")
            ? inputValue.split(":").slice(1).join(":").trim()
            : inputValue;
    }, [inputValue]);

    // Helper to check if a nav prefix is being used
    const isNavPrefix = (input: string): boolean => {
        if (!input.includes(":")) return false;
        const inputPrefix = input.toLowerCase().split(":")[0];
        return navPrefixes.some(
            (prefix) => prefix.startsWith(inputPrefix) || inputPrefix.startsWith(prefix)
        );
    };

    // Filter nav items based on search input, then limit results
    // Show nav items when no prefix or a nav prefix is used (e.g., "nav:", "menu:")
    // Hide nav items when other prefixes are used (e.g., "cus:", "entity:")
    const filteredNavItems = useMemo(() => {
        const hasColon = inputValue.includes(":");
        const usingNavPrefix = isNavPrefix(inputValue);

        // Hide nav items if using a non-nav prefix
        if (hasColon && !usingNavPrefix) {
            return [];
        }

        // Extract search term (after colon if nav prefix, otherwise full input)
        const searchTerm = usingNavPrefix
            ? inputValue.split(":").slice(1).join(":").trim()
            : inputValue;

        if (!searchTerm) {
            return navMenuItems.slice(0, MAX_NAV_RESULTS);
        }

        const searchLower = searchTerm.toLowerCase();
        return navMenuItems
            .filter((item) => {
                const searchText = `${item.label} ${item.breadcrumb}`.toLowerCase();
                return searchText.includes(searchLower);
            })
            .slice(0, MAX_NAV_RESULTS);
    }, [navMenuItems, inputValue]);

    // Fetch nav menu data, permissions, and custom record types on mount
    useEffect(() => {
        fetchNavMenuData().then(({ data, error }) => {
            if (error) {
                console.error("Failed to fetch nav menu:", error);
                return;
            }
            if (data) {
                setNavMenuItems(data);
            }
        });

        fetchPermissions().then(({ data, error }) => {
            if (error) {
                console.error("Failed to fetch permissions:", error);
                return;
            }
            if (data) {
                setPermissions(data);
            }
        });

        fetchCustomRecordTypes().then(({ data, error }) => {
            if (error) {
                console.error("Failed to fetch custom record types:", error);
                return;
            }
            if (data) {
                setCustomRecordTypes(data);
            }
        });
    }, []);

    const onInputChange = async (query: string) => {
        setQueriedData([]);
        setCustomRecordInstances([]);
        setAutosuggestResults([]);
        setInputValue(query);
        requestIdRef.current += 1;

        if (timeoutRef.current) globalThis.clearTimeout(timeoutRef.current);

        const currentRequestId = requestIdRef.current;
        timeoutRef.current = globalThis.setTimeout(() => {
            fetchResults(query, currentRequestId);
        }, 500);

        // Only show fetching state if the actual search term (after prefix) is >= 2 chars
        const searchTerm = query.includes(":") ? query.split(":").slice(1).join(":").trim() : query;

        if (searchTerm?.length >= 2) {
            setIsFetching(true);
        } else {
            // Reset fetching state when search term is too short (e.g., user typed "ve" then added ":")
            setIsFetching(false);
        }
    };

    const onCustomerClick = () => {
        onInputChange(`${mapping.customer.prefix}:`);
    };
    const onVendorClick = () => {
        onInputChange(`${mapping.vendor.prefix}:`);
    };
    const onEntityClick = () => {
        onInputChange(`${mapping.entity.prefix}:`);
    };
    const onEmployeeClick = () => {
        onInputChange(`${mapping.employee.prefix}:`);
    };
    const onTransactionClick = () => {
        onInputChange(`${mapping.transaction.prefix}:`);
    };
    const onCustomRecordDefinitionClick = () => {
        onInputChange(`${mapping.customRecordDefinition.prefix}:`);
    };
    const onCustomListDefinitionClick = () => {
        onInputChange(`${mapping.customListDefinition.prefix}:`);
    };

    const suggestions = [
        { id: "customer", label: "Search for a customer", onSelect: onCustomerClick },
        { id: "vendor", label: "Search for a vendor", onSelect: onVendorClick },
        { id: "employee", label: "Search for an employee", onSelect: onEmployeeClick },
        { id: "entity", label: "Search for an entity", onSelect: onEntityClick },
        { id: "transaction", label: "Search for a transaction", onSelect: onTransactionClick },
        {
            id: "customRecordDefinition",
            label: "Search for a custom record definition",
            onSelect: onCustomRecordDefinitionClick,
        },
        {
            id: "customListDefinition",
            label: "Search for a custom list definition",
            onSelect: onCustomListDefinitionClick,
        },
    ];

    const fetchData = async ({ query, type, requestId }) => {
        const { data, error } = await fetchQuery<{
            id: number;
            label: string;
            description?: string;
            urlbase?: string;
        }>(
            buildSuiteQLQuery({
                query,
                type,
            })
        );

        if (error) {
            console.error(error);
            return [];
        }

        // Only update state if this request is still current
        devLog("fetchData result", {
            current: requestIdRef.current,
            requestId,
            dataLength: data?.length,
        });
        if (requestIdRef.current === requestId && data?.length) {
            // Add description and URLs from mapping if not already present in data
            const dataWithDescription = data.map((item) => ({
                ...item,
                description: item.description || type.description,
                urlBase: item.urlbase || type.urlBase,
                listUrlBase: type.listUrlBase,
            }));
            devLog("Setting data", dataWithDescription);
            setQueriedData((prevState) => {
                devLog("prevState", prevState);
                return [...prevState, ...dataWithDescription];
            });
        } else {
            devLog("Skipping data - stale request or no data");
        }
        return data ?? [];
    };

    const fetchCustomRecordInstanceResults = async (searchText: string, requestId: number) => {
        if (searchableCustomRecordTypes.length === 0) {
            return;
        }

        const { data, error } = await searchCustomRecordInstances(
            searchText,
            searchableCustomRecordTypes
        );

        if (error) {
            console.error("Failed to search custom record instances:", error);
            return;
        }

        // Only update if this request is still current
        if (requestIdRef.current === requestId && data?.length) {
            setCustomRecordInstances(data);
        }
    };

    const fetchAutosuggestResults = async (searchText: string, requestId: number) => {
        const { data, error } = await fetchAutosuggest(searchText);

        if (error) {
            console.error("Failed to fetch autosuggest:", error);
            return;
        }

        // Only update if this request is still current
        if (requestIdRef.current === requestId && data?.length) {
            setAutosuggestResults(data);
        }
    };

    // Helper to check if input starts with a prefix (supports partial prefixes)
    // e.g., "ven:" matches vendor, "vendor:" also matches vendor, "sc:" matches script
    const matchesPrefix = (input: string, prefix: string): boolean => {
        const inputLower = input.toLowerCase();
        const colonIndex = inputLower.indexOf(":");
        if (colonIndex === -1) return false;

        const inputPrefix = inputLower.slice(0, colonIndex);
        // Match if input prefix is the start of the defined prefix (partial match)
        // OR if the defined prefix is the start of the input prefix (extended match like "vendor" for "ven")
        return prefix.startsWith(inputPrefix) || inputPrefix.startsWith(prefix);
    };

    // Default types to search when no prefix is specified (all except "entity" which is a superset)
    const defaultSearchTypes = Object.keys(mapping).filter((key) => key !== "entity");

    // Get which record types to search based on prefix
    const getTypesToSearch = (fullQuery: string): string[] => {
        if (!fullQuery.includes(":")) {
            return defaultSearchTypes;
        }

        // If using a nav prefix, don't search any record types
        if (isNavPrefix(fullQuery)) {
            return [];
        }

        // Check each mapping for a matching prefix
        for (const [key, config] of Object.entries(mapping)) {
            if (matchesPrefix(fullQuery, config.prefix)) {
                // Special case: entity prefix searches entity table only (instead of customer/vendor/employee)
                if (key === "entity") return ["entity"];
                return [key];
            }
        }

        // No matching prefix found, return empty (no searches)
        return [];
    };

    const fetchResults = async (fullQuery: string, requestId: number) => {
        if (!fullQuery) {
            return [];
        }
        const isIncludeColon = fullQuery.includes(":");
        const splitQuery = fullQuery.split(":");
        const searchString = isIncludeColon ? splitQuery[1] : splitQuery[0];

        const query = searchString?.trim?.();

        if (!query) {
            return;
        }

        if (query.length < 2) {
            return [];
        }

        const typesToSearch = getTypesToSearch(fullQuery);
        const sharedOptions = { query, requestId };

        const promises: Promise<any>[] = [];

        // Add fetch promises only for the types we should search
        for (const typeKey of typesToSearch) {
            if (mapping[typeKey]) {
                promises.push(fetchData({ ...sharedOptions, type: mapping[typeKey] }));
            }
        }

        // Search custom record instances only when no prefix is used
        if (!isIncludeColon) {
            promises.push(fetchCustomRecordInstanceResults(query, requestId));
        }

        // Always fetch autosuggest with the full query - NetSuite's native search handles prefixes
        promises.push(fetchAutosuggestResults(fullQuery, requestId));

        Promise.allSettled(promises).then((results) => {
            devLog("results", results);
            setIsFetching(false);
        });

        return [];
    };

    return (
        <CommandDialog
            open={true}
            onOpenChange={setIsOpen}
            className={
                "plasmo:bg-background plasmo:text-foreground plasmo:p-0! plasmo:z-1002 plasmo:w-[50vw]! plasmo:max-w-[50vw]!"
            }
            filter={(value, search) => {
                // Skip filtering for autosuggest items (they have URLs in the value)
                // NetSuite already filtered these server-side
                if (value.includes("/app/")) return 1;

                // Strip prefix (e.g., "entity:", "cus:") from search before filtering
                const searchWithoutPrefix = search.includes(":")
                    ? search.split(":").slice(1).join(":").trim()
                    : search;
                // If no search term after prefix, show all items
                if (!searchWithoutPrefix) return 1;
                // Case-insensitive includes matching
                const matches = value.toLowerCase().includes(searchWithoutPrefix.toLowerCase());
                return matches ? 1 : 0;
            }}
        >
            <div className={"plasmo:relative plasmo:flex plasmo:items-center"}>
                <CommandInput
                    className={"plasmo:text-foreground! plasmo:pr-16!"}
                    placeholder="Type a command or search..."
                    value={inputValue}
                    onValueChange={onInputChange}
                />
                {isFetching && (
                    <div className={"plasmo:fixed plasmo:right-10 plasmo:opacity-50"}>
                        <Spinner />
                    </div>
                )}
            </div>

            <CommandList className={"plasmo:max-h-[40vh]"}>
                {!!(isFetching && !queriedData?.length) && (
                    <CommandLoading>Fetching...</CommandLoading>
                )}
                {!isFetching && <CommandEmpty>No results found.</CommandEmpty>}
                {!inputValue && (
                    <>
                        <CommandGroup heading="Suggestions">
                            {suggestions.map(({ id, label, ...suggestion }) => (
                                <CommandItem key={id} {...suggestion}>
                                    <div className={"plasmo:text-base"}>{label}</div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                        <CommandSeparator />
                    </>
                )}

                {!!queriedData?.length && (
                    <CommandGroup heading="Results">
                        {queriedData.slice(0, MAX_QUERY_RESULTS).map((row, index) => {
                            const definitionUrl =
                                row.urlBase && row.id ? row.urlBase + `?id=${row.id}` : "";
                            const listUrl =
                                row.listUrlBase && row.id
                                    ? `${row.listUrlBase}?rectype=${row.id}`
                                    : null;
                            // Use list URL as default if available, otherwise fall back to definition URL
                            const defaultRowUrl = listUrl || definitionUrl;

                            const onRowSelect = async () => {
                                if (row.id && row.recordtype) {
                                    try {
                                        if (defaultRowUrl) {
                                            window.open(defaultRowUrl);
                                            return;
                                        }
                                        const { error, url: recordUrl } = await resolveRecordUrl({
                                            recordId: row.id,
                                            recordType: row.recordtype,
                                        });

                                        devLog(recordUrl);
                                    } catch (e) {
                                        console.error(e);
                                    }
                                }
                            };

                            // When both URLs exist, show icons to access each separately
                            const hasMultipleLinks = listUrl && definitionUrl;

                            if (hasMultipleLinks) {
                                // Don't use asChild - keep as regular item with icon buttons
                                return (
                                    <CommandItem
                                        key={row.id || index}
                                        value={row.label}
                                        className="plasmo:flex plasmo:w-full plasmo:items-center"
                                    >
                                        <span className={"plasmo:text-base"}>{row.label}</span>
                                        {row.description && (
                                            <Badge
                                                // variant="secondary"
                                                size="md"
                                                className="plasmo:ml-auto"
                                            >
                                                {row.description}
                                            </Badge>
                                        )}
                                        <div className="plasmo:flex plasmo:gap-1">
                                            <a
                                                href={listUrl}
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                title="View record list"
                                                className="plasmo:p-1 plasmo:hover:bg-accent plasmo:rounded"
                                            >
                                                <List className="plasmo:size-4" />
                                            </a>
                                            <a
                                                href={definitionUrl}
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                title="View definition"
                                                className="plasmo:p-1 plasmo:hover:bg-accent plasmo:rounded"
                                            >
                                                <FileText className="plasmo:size-4" />
                                            </a>
                                        </div>
                                    </CommandItem>
                                );
                            }

                            const rowContent = (
                                <>
                                    <span className={"plasmo:text-base"}>{row.label}</span>
                                    {row.description && (
                                        <Badge
                                            // variant="secondary"
                                            size="md"
                                            className="plasmo:ml-auto"
                                        >
                                            {row.description}
                                        </Badge>
                                    )}
                                </>
                            );

                            if (defaultRowUrl) {
                                return (
                                    <CommandItem key={row.id || index} value={row.label} asChild>
                                        <a
                                            href={defaultRowUrl}
                                            rel="noopener noreferrer"
                                            className="plasmo:flex plasmo:w-full plasmo:items-center"
                                        >
                                            {rowContent}
                                        </a>
                                    </CommandItem>
                                );
                            }

                            return (
                                <CommandItem
                                    key={row.id || index}
                                    value={row.label}
                                    onSelect={onRowSelect}
                                >
                                    {rowContent}
                                </CommandItem>
                            );
                        })}
                    </CommandGroup>
                )}

                {!!customRecordInstances?.length && (
                    <CommandGroup heading="Custom Record Instances">
                        {customRecordInstances.slice(0, MAX_QUERY_RESULTS).map((instance) => {
                            const instanceUrl = `/app/common/custom/custrecordentry.nl?rectype=${instance.recordtypeid}&id=${instance.id}`;
                            return (
                                <CommandItem
                                    key={`${instance.scriptid}-${instance.id}`}
                                    value={`${instance.name} ${instance.recordtypename}`}
                                    asChild
                                >
                                    <a
                                        href={instanceUrl}
                                        rel="noopener noreferrer"
                                        className="plasmo:flex plasmo:w-full plasmo:items-center"
                                    >
                                        <span className={"plasmo:text-base"}>{instance.name}</span>
                                        <Badge
                                            // variant="secondary"
                                            size="md"
                                            className="plasmo:ml-auto"
                                        >
                                            {instance.recordtypename}
                                        </Badge>
                                    </a>
                                </CommandItem>
                            );
                        })}
                    </CommandGroup>
                )}

                {!!filteredAutosuggestResults?.length && (
                    <CommandGroup heading="Quick Search">
                        {filteredAutosuggestResults
                            .slice(0, MAX_AUTOSUGGEST_RESULTS)
                            .map((result, index) => (
                                <CommandItem
                                    key={`autosuggest-${result.key}-${index}`}
                                    value={`${result.sname} ${result.descr} ${result.key}`}
                                    asChild
                                >
                                    <a
                                        href={result.key}
                                        rel="noopener noreferrer"
                                        className="plasmo:flex plasmo:w-full plasmo:items-center"
                                    >
                                        <span className={"plasmo:text-base"}>{result.sname}</span>
                                        <Badge size="md" className="plasmo:ml-auto">
                                            {result.descr}
                                        </Badge>
                                    </a>
                                </CommandItem>
                            ))}
                    </CommandGroup>
                )}

                {!!(filteredAutosuggestResults?.length >= 5) && (
                    <CommandGroup>
                        <CommandItem value={currentSearchTerm} asChild>
                            <a
                                href={buildUberSearchUrl(currentSearchTerm)}
                                rel="noopener noreferrer"
                                className="plasmo:flex plasmo:w-full plasmo:items-center plasmo:justify-center plasmo:gap-4"
                            >
                                <span className="plasmo:text-base">
                                    See all results for &#34;{currentSearchTerm}&#34;
                                </span>
                                <ExternalLink className="plasmo:size-4 plasmo:text-muted-foreground" />
                            </a>
                        </CommandItem>
                    </CommandGroup>
                )}

                {!!(filteredNavItems?.length && currentSearchTerm) && (
                    <CommandGroup heading="Navigation">
                        {filteredNavItems.map((item) => (
                            <CommandItem
                                key={item.id}
                                value={`${item.label} ${item.breadcrumb}`}
                                asChild
                            >
                                <a
                                    href={item.url}
                                    rel="noopener noreferrer"
                                    className="plasmo:flex plasmo:w-full plasmo:items-center plasmo:text-base"
                                >
                                    <span className={"plasmo:text-base"}>{item.label}</span>
                                    <Badge
                                        // variant="outline"
                                        size="md"
                                        className="plasmo:ml-auto plasmo:text-muted-foreground plasmo:font-normal"
                                    >
                                        {item.breadcrumb}
                                    </Badge>
                                </a>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                )}

                <CommandGroup heading="Record Lists">
                    {recordLists.map((item) => (
                        <CommandItem key={item.id} value={item.label} asChild>
                            <a
                                href={item.url}
                                rel="noopener noreferrer"
                                className="plasmo:flex plasmo:w-full plasmo:items-center"
                            >
                                <span className={"plasmo:text-base"}>{item.label}</span>
                            </a>
                        </CommandItem>
                    ))}
                </CommandGroup>

                <CommandGroup heading="Tools">
                    <CommandItem
                        onSelect={() => {
                            onOpenTool?.("sql-editor");
                        }}
                    >
                        <Code className="plasmo:mr-2" />
                        <span className={"plasmo:text-base"}>SuiteQL Editor</span>
                        <ShortcutDisplay tool="sql-editor" />
                    </CommandItem>
                    <CommandItem
                        onSelect={() => {
                            onOpenTool?.("script-log-viewer");
                        }}
                    >
                        <ScrollText className="plasmo:mr-2" />
                        <span className={"plasmo:text-base"}>Script Log Viewer</span>
                        <ShortcutDisplay tool="script-log-viewer" />
                    </CommandItem>
                    <CommandItem
                        onSelect={() => {
                            onOpenTool?.("load-modules");
                        }}
                    >
                        <Terminal className="plasmo:mr-2" />
                        <span className={"plasmo:text-base"}>Load NetSuite Modules</span>
                        <ShortcutDisplay tool="load-modules" />
                    </CommandItem>
                </CommandGroup>
            </CommandList>
        </CommandDialog>
    );
};
