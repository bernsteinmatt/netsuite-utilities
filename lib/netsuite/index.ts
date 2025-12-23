// SuiteQL query execution
export { escapeSqlString, executeQuery, fetchQuery } from "./suiteql";

// Permissions
export {
    fetchPermissions,
    getPermission,
    hasPermission,
    PermissionLevel,
    type Permissions,
} from "./permissions";

// Navigation menu
export {
    fetchNavMenuData,
    type FlatNavMenuItem,
    type NavMenuItem,
} from "./navigation";

// Custom records
export {
    fetchCustomRecordTypes,
    getSearchableCustomRecordTypes,
    searchCustomRecordInstances,
    type CustomRecordInstance,
    type CustomRecordType,
} from "./custom-records";

// Autosuggest/search
export {
    buildUberSearchUrl,
    fetchAutosuggest,
    type AutosuggestResult,
} from "./autosuggest";

// URL resolution
export { resolveRecordUrl } from "./url-resolver";
