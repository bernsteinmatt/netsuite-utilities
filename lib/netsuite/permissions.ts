import { isNetSuite } from "@/lib/is-netsuite";

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
