import { hasPermission, PermissionLevel, type Permissions } from "./permissions";
import { escapeSqlString, fetchQuery } from "./suiteql";

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
