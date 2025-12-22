import { isNetSuite } from "@/lib/is-netsuite";
import { mockData as defaultMockData } from "@/lib/mock-data";





export const escapeSqlString = (value: string): string => {
    // Escape single quotes by doubling them
    // Strip double quotes - SuiteQL doesn't support them in LIKE patterns
    return value.replace(/'/g, "''").replace(/"/g, "");
};

export const executeQuery = async (
    query: string,
    { mockData = defaultMockData, timeout = 1500 } = {}
): Promise<{ error: string | null; data: any }> => {
    try {
        const fetchBody = {
            method: "remoteObject.bridgeCall",
            params: [
                "queryApiBridge",
                "runSuiteQL",
                `["${query.replaceAll("\n", "\\n")}","[]","SUITE_QL",""]`,
            ],
        };

        if (!isNetSuite()) {
            await new Promise((resolve) => setTimeout(resolve, timeout));
            return { data: mockData, error: null };
        } else {
            const nsResponse = await fetch(
                "/app/common/scripting/PlatformClientScriptHandler.nl?script=&deploy=",
                {
                    headers: {
                        accept: "*/*",
                        "accept-language": "en-US,en;q=0.9",
                        "cache-control": "no-cache",
                        "content-type": "text/plain;charset=UTF-8",
                    },
                    referrerPolicy: "strict-origin-when-cross-origin",
                    body: JSON.stringify(fetchBody),
                    method: "POST",
                    mode: "cors",
                    credentials: "include",
                }
            );

            if (!nsResponse.ok) {
                const errorResponse = await nsResponse.text();
                throw new Error(`Error response: ${errorResponse}`);
            }

            const data = await nsResponse.json();

            if (data.code) {
                throw new Error(`${data.code}\n\n${data.details}`);
            }
            return { error: null, data };
        }
    } catch (error: any) {
        return { error: error.message, data: null };
    }
};

interface NetSuiteQueryResponse {
    count: number;
    aliases: string[];
    [key: string]: unknown;
}

const convertNetSuiteResponse = <T>(response: NetSuiteQueryResponse): T[] => {
    const result: T[] = [];

    for (let i = 0; i < response.count; i++) {
        const rowKey = `v${i}`;
        const row = response[rowKey];

        if (!row || !Array.isArray(row)) {
            continue;
        }

        const obj = {} as T;
        response.aliases.forEach((alias, index) => {
            (obj as Record<string, unknown>)[alias] = row[index];
        });

        result.push(obj);
    }

    return result;
};

export const fetchQuery = async <T = Record<string, unknown>>(
    query: string,
    options: { mockData?: T[]; timeout?: number } = {}
): Promise<{ error: string | null; data: T[] | null }> => {
    const { error, data } = await executeQuery(query, options as { mockData?: any[]; timeout?: number });

    if (error) {
        return { error, data: null };
    }

    // Mock data is already an array, NetSuite returns { result: { result: { v0, v1, ..., aliases, count } } }
    if (Array.isArray(data)) {
        return { error: null, data };
    }

    const nsResponse = data?.result?.result as NetSuiteQueryResponse | undefined;
    if (nsResponse?.aliases && typeof nsResponse.count === "number") {
        const items = convertNetSuiteResponse<T>(nsResponse);
        return { error: null, data: items };
    }

    return { error: null, data: [] };
};

export interface NavMenuItem {
    type: "TAB" | "OVERVIEW" | "CATEGORY" | "TASK" | "TASK_MODE";
    id?: string;
    label: string;
    url?: string;
    submenu: NavMenuItem[];
}

export interface FlatNavMenuItem {
    id: string;
    label: string;
    url: string;
    breadcrumb: string;
}

const flattenNavMenu = (
    items: NavMenuItem[],
    breadcrumb: string[] = []
): FlatNavMenuItem[] => {
    const result: FlatNavMenuItem[] = [];

    for (const item of items) {
        const currentBreadcrumb = [...breadcrumb, item.label];

        // Only include items with URLs (these are navigable)
        if (item.url && item.id) {
            result.push({
                id: item.id,
                label: item.label,
                url: item.url,
                breadcrumb: currentBreadcrumb.join(" > "),
            });
        }

        // Recursively process submenus
        if (item.submenu?.length) {
            result.push(...flattenNavMenu(item.submenu, currentBreadcrumb));
        }
    }

    return result;
};

// Mock nav menu data for development
const mockNavMenuData: NavMenuItem[] = [
    {
        type: "TAB",
        id: "-62",
        label: "Activities",
        url: "/app/center/card.nl?sc=-62",
        submenu: [
            {
                type: "TASK",
                id: "LIST_EVENT",
                label: "Events",
                url: "/app/crm/calendar/eventlist.nl",
                submenu: [],
            },
            {
                type: "TASK",
                id: "LIST_TASK",
                label: "Tasks",
                url: "/app/crm/calendar/tasklist.nl",
                submenu: [],
            },
        ],
    },
    {
        type: "TAB",
        id: "111",
        label: "Setup",
        url: "/app/center/card.nl?sc=111",
        submenu: [
            {
                type: "TASK",
                id: "LIST_EMPLOYEE",
                label: "Employees",
                url: "/app/common/entity/employeelist.nl",
                submenu: [],
            },
        ],
    },
];

export const fetchNavMenuData = async (): Promise<{
    error: string | null;
    data: FlatNavMenuItem[] | null;
}> => {
    try {
        if (!isNetSuite()) {
            // Return mock data for development
            await new Promise((resolve) => setTimeout(resolve, 300));
            const flatData = flattenNavMenu(mockNavMenuData);
            return { error: null, data: flatData };
        }

        const timestamp = Date.now();
        const response = await fetch(
            `/app/center/NLNavMenuData.nl?_=${timestamp}`,
            {
                headers: {
                    accept: "application/json; q=1.0, text/*; q=0.8, */*; q=0.1",
                    "cache-control": "no-cache",
                    pragma: "no-cache",
                    "x-requested-with": "XMLHttpRequest",
                },
                method: "GET",
                mode: "cors",
                credentials: "include",
            }
        );

        if (!response.ok) {
            throw new Error(`Failed to fetch nav menu: ${response.status}`);
        }

        const data: NavMenuItem[] = await response.json();
        const flatData = flattenNavMenu(data);

        // Deduplicate by URL (same page can appear in multiple menu locations)
        const seen = new Set<string>();
        const uniqueData = flatData.filter((item) => {
            if (seen.has(item.url)) return false;
            seen.add(item.url);
            return true;
        });

        return { error: null, data: uniqueData };
    } catch (error: any) {
        return { error: error.message, data: null };
    }
};

// Permission levels in NetSuite
export enum PermissionLevel {
    NONE = 0,
    VIEW = 1,
    CREATE = 2,
    EDIT = 3,
    FULL = 4,
}

export type Permissions = Record<string, PermissionLevel>;

// Mock permissions for development
const mockPermissions: Permissions = {
    LIST_CUSTRECORDENTRY: 4,
    ADMI_CUSTLIST: 4,
    ADMI_CUSTRECORD: 4,
    LIST_ACCOUNT: 4,
    LIST_CUSTOMER: 4,
    LIST_VENDOR: 4,
    LIST_EMPLOYEE: 4,
    // Mock custom record permissions
    LIST_CUSTRECORDENTRY889: 4,
    LIST_CUSTRECORDENTRY890: 4,
};

let cachedPermissions: Permissions | null = null;

export const fetchPermissions = async (): Promise<{
    error: string | null;
    data: Permissions | null;
}> => {
    // Return cached permissions if available
    if (cachedPermissions) {
        return { error: null, data: cachedPermissions };
    }

    try {
        if (!isNetSuite()) {
            await new Promise((resolve) => setTimeout(resolve, 100));
            cachedPermissions = mockPermissions;
            return { error: null, data: mockPermissions };
        }

        const response = await fetch(
            "/app/common/scripting/nlapijsonhandler.nl",
            {
                headers: {
                    accept: "*/*",
                    "cache-control": "no-cache",
                    "content-type": "application/x-www-form-urlencoded",
                    nsxmlhttprequest: "NSXMLHttpRequest",
                    pragma: "no-cache",
                },
                body: "jrid=2&jrmethod=remoteObject.getPermissions&jrparams=%5B%5D",
                method: "POST",
                mode: "cors",
                credentials: "include",
            }
        );

        if (!response.ok) {
            throw new Error(`Failed to fetch permissions: ${response.status}`);
        }

        const data = await response.json();

        if (data.result) {
            cachedPermissions = data.result;
            return { error: null, data: data.result };
        }

        return { error: "No permissions data in response", data: null };
    } catch (error: any) {
        return { error: error.message, data: null };
    }
};

export const getPermission = (
    permissions: Permissions | null,
    permissionId: string
): PermissionLevel => {
    if (!permissions) return PermissionLevel.NONE;
    return permissions[permissionId] ?? PermissionLevel.NONE;
};

export const hasPermission = (
    permissions: Permissions | null,
    permissionId: string,
    requiredLevel: PermissionLevel = PermissionLevel.VIEW
): boolean => {
    return getPermission(permissions, permissionId) >= requiredLevel;
};

// Custom Record Types
export interface CustomRecordType {
    id: number;
    name: string;
    scriptid: string;
    allowquicksearch: string;
    nopermissionrequired: string;
    usepermissions: string;
}

// Mock custom record types for development
const mockCustomRecordTypes: CustomRecordType[] = [
    { id: 889, name: "Project Tracker", scriptid: "customrecord_project_tracker", allowquicksearch: "T", nopermissionrequired: "F", usepermissions: "T" },
    { id: 890, name: "Task Log", scriptid: "customrecord_task_log", allowquicksearch: "T", nopermissionrequired: "F", usepermissions: "T" },
    { id: 891, name: "Budget Item", scriptid: "customrecord_budget_item", allowquicksearch: "F", nopermissionrequired: "T", usepermissions: "F" },
];

let cachedCustomRecordTypes: CustomRecordType[] | null = null;

export const fetchCustomRecordTypes = async (): Promise<{
    error: string | null;
    data: CustomRecordType[] | null;
}> => {
    // Return cached data if available
    if (cachedCustomRecordTypes) {
        return { error: null, data: cachedCustomRecordTypes };
    }

    const query = `
        SELECT
            internalid AS id,
            name,
            scriptid,
            allowquicksearch,
            noPermissionRequired,
            usePermissions
        FROM
            CustomRecordType
        WHERE
            isinactive = 'F'
    `;

    const { error, data } = await fetchQuery<CustomRecordType>(query, {
        mockData: mockCustomRecordTypes,
    });

    if (error) {
        return { error, data: null };
    }

    if (data) {
        cachedCustomRecordTypes = data;
    }

    return { error: null, data };
};

export const getSearchableCustomRecordTypes = (
    customRecordTypes: CustomRecordType[] | null,
    permissions: Permissions | null
): CustomRecordType[] => {
    if (!customRecordTypes) return [];

    return customRecordTypes.filter((crt) => {
        // If no permission required, allow access
        if (crt.nopermissionrequired === "T") {
            return true;
        }

        // Check if user has permission for this custom record type
        const permissionKey = `LIST_CUSTRECORDENTRY${crt.id}`;
        return hasPermission(permissions, permissionKey, PermissionLevel.VIEW);
    });
};

export interface CustomRecordInstance {
    id: number;
    name: string;
    recordtypeid: number;
    recordtypename: string;
    scriptid: string;
}

// Mock custom record instances for development
const mockCustomRecordInstances: CustomRecordInstance[] = [
    { id: 1, name: "Project Alpha", recordtypeid: 889, recordtypename: "Project Tracker", scriptid: "customrecord_project_tracker" },
    { id: 2, name: "Project Beta", recordtypeid: 889, recordtypename: "Project Tracker", scriptid: "customrecord_project_tracker" },
    { id: 1, name: "Task: Review Code", recordtypeid: 890, recordtypename: "Task Log", scriptid: "customrecord_task_log" },
    { id: 2, name: "Task: Deploy App", recordtypeid: 890, recordtypename: "Task Log", scriptid: "customrecord_task_log" },
];

const MAX_UNIONS_PER_BATCH = 10;

export const searchCustomRecordInstances = async (
    searchText: string,
    customRecordTypes: CustomRecordType[]
): Promise<{ error: string | null; data: CustomRecordInstance[] | null }> => {
    if (!customRecordTypes.length || !searchText || searchText.length < 2) {
        return { error: null, data: [] };
    }

    const cleanedText = escapeSqlString(searchText);

    console.log("cleanedText HERE", cleanedText);
    // Build individual SELECT queries for each custom record type
    const selectQueries = customRecordTypes.map((crt) => {
        return `
            SELECT
                id,
                name,
                ${crt.id} AS recordTypeId,
                '${escapeSqlString(crt.name)}' AS recordTypeName,
                '${escapeSqlString(crt.scriptid)}' AS scriptid
            FROM
                ${crt.scriptid}
            WHERE
                LOWER(name) LIKE LOWER('%${cleanedText}%')
        `;
    });

    console.log("selectQueries", selectQueries[0]);

    // Batch queries into groups of MAX_UNIONS_PER_BATCH
    const batches: string[][] = [];
    for (let i = 0; i < selectQueries.length; i += MAX_UNIONS_PER_BATCH) {
        batches.push(selectQueries.slice(i, i + MAX_UNIONS_PER_BATCH));
    }

    // Execute all batches in parallel
    const batchPromises = batches.map((batch) => {
        const query = batch.join(" UNION ALL ") + " FETCH FIRST 20 ROWS ONLY";
        return fetchQuery<CustomRecordInstance>(query, {
            mockData: mockCustomRecordInstances.filter((item) =>
                item.name.toLowerCase().includes(searchText.toLowerCase())
            ),
        });
    });

    const results = await Promise.all(batchPromises);

    // Combine results from all batches
    const allData: CustomRecordInstance[] = [];
    for (const result of results) {
        if (result.error) {
            console.error("Batch query error:", result.error);
            continue;
        }
        if (result.data) {
            allData.push(...result.data);
        }
    }

    return { error: null, data: allData };
};

export const resolveRecordUrl = async (options: {
    recordType: string;
    recordId: number | string;
    isEditMode?: boolean;
}): Promise<{ error: string | null; url: string | null }> => {
    const { recordType, recordId, isEditMode = false } = options;

    if (!isNetSuite()) {
        // Mock response for development
        const mockUrl = `/app/common/entity/${recordType}.nl?id=${recordId}`;
        return { error: null, url: mockUrl };
    }

    try {
        const params = JSON.stringify([
            "RECORD",
            recordType,
            recordId,
            isEditMode ? "EDIT" : null,
        ]);

        const body = new URLSearchParams({
            jrid: "1",
            jrmethod: "remoteObject.nlapiResolveURL",
            jrparams: params,
        });

        const nsResponse = await fetch(
            "/app/common/scripting/ClientScriptHandler.nl?script=&deploy=",
            {
                headers: {
                    accept: "*/*",
                    "content-type": "application/x-www-form-urlencoded",
                },
                body: body.toString(),
                method: "POST",
            }
        );

        if (!nsResponse.ok) {
            const errorResponse = await nsResponse.text();
            throw new Error(`Error response: ${errorResponse}`);
        }

        const data = await nsResponse.json();

        if (data.errorCode !== 0) {
            throw new Error(`NetSuite error: ${data.errorCode}`);
        }

        return { error: null, url: data.result };
    } catch (error: any) {
        return { error: error.message, url: null };
    }
};

// Autosuggest API types
export interface AutosuggestResult {
    sname: string; // Display name
    key: string; // URL path
    descr: string; // Record type description (e.g., "Customer", "Employee")
    bedit?: string; // Whether editable
    dashurl?: string; // Dashboard URL
}

interface AutosuggestResponse {
    autofill: AutosuggestResult[];
    asheep?: string;
    asuuk?: string;
}

// Mock autosuggest data for development
const mockAutosuggestResults: AutosuggestResult[] = [
    { sname: "Test Customer", key: "/app/common/entity/custjob.nl?id=1491", descr: "Customer", bedit: "T", dashurl: "/app/center/card.nl?sc=-69&entityid=1491" },
    { sname: "Test Vendor", key: "/app/common/entity/vendor.nl?id=1234", descr: "Vendor", bedit: "T", dashurl: "" },
    { sname: "Test Employee", key: "/app/common/entity/entity.nl?id=1511", descr: "Employee", bedit: "T", dashurl: "" },
    { sname: "Test Transaction", key: "/app/accounting/transactions/salesord.nl?id=5678", descr: "Sales Order", bedit: "T", dashurl: "" },
    { sname: "Test Project", key: "/app/common/custom/custrecordentry.nl?rectype=889&id=1", descr: "Project Tracker", bedit: "T", dashurl: "" },
];

export const fetchAutosuggest = async (
    searchText: string
): Promise<{ error: string | null; data: AutosuggestResult[] | null }> => {
    if (!searchText || searchText.length < 2) {
        return { error: null, data: [] };
    }

    try {
        if (!isNetSuite()) {
            // Return filtered mock data for development
            await new Promise((resolve) => setTimeout(resolve, 200));
            const filtered = mockAutosuggestResults.filter((item) =>
                item.sname.toLowerCase().includes(searchText.toLowerCase())
            );
            return { error: null, data: filtered };
        }

        const encodedSearch = encodeURIComponent(searchText);
        // circid appears to be a simple circuit/request identifier, not a timestamp
        const response = await fetch(
            `/app/common/autosuggest.nl?cur_val=${encodedSearch}&mapkey=uberautosuggest&circid=1`,
            {
                headers: {
                    accept: "application/json; q=1.0, text/*; q=0.8, */*; q=0.1",
                    "cache-control": "no-cache",
                    pragma: "no-cache",
                    "x-requested-with": "XMLHttpRequest",
                },
                method: "GET",
                mode: "cors",
                credentials: "include",
            }
        );

        if (!response.ok) {
            throw new Error(`Failed to fetch autosuggest: ${response.status}`);
        }

        const data: AutosuggestResponse = await response.json();

        return { error: null, data: data.autofill || [] };
    } catch (error: any) {
        return { error: error.message, data: null };
    }
};

// Build the URL for "See all results" in NetSuite's native search
export const buildUberSearchUrl = (searchText: string): string => {
    const encodedSearch = encodeURIComponent(searchText);
    return `/app/common/search/ubersearchresults.nl?quicksearch=T&searchtype=Uber&frame=be&Uber_NAMEtype=KEYWORDSTARTSWITH&Uber_NAME=${encodedSearch}`;
};
