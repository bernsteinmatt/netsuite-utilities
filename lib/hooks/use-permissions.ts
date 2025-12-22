import { useEffect, useState } from "react";

import {
    fetchPermissions,
    getPermission,
    hasPermission,
    PermissionLevel,
    type Permissions,
} from "~lib/fetch-query";

interface UsePermissionsReturn {
    permissions: Permissions | null;
    isLoading: boolean;
    error: string | null;
    getPermission: (permissionId: string) => PermissionLevel;
    hasPermission: (
        permissionId: string,
        requiredLevel?: PermissionLevel
    ) => boolean;
}

export const usePermissions = (): UsePermissionsReturn => {
    const [permissions, setPermissions] = useState<Permissions | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchPermissions().then(({ data, error: fetchError }) => {
            if (fetchError) {
                setError(fetchError);
            }
            if (data) {
                setPermissions(data);
            }
            setIsLoading(false);
        });
    }, []);

    return {
        permissions,
        isLoading,
        error,
        getPermission: (permissionId: string) =>
            getPermission(permissions, permissionId),
        hasPermission: (
            permissionId: string,
            requiredLevel: PermissionLevel = PermissionLevel.VIEW
        ) => hasPermission(permissions, permissionId, requiredLevel),
    };
};
