// Wrapper hook for boolean values using useStorage
import { useStorage } from "@plasmohq/storage/hook";

interface UseStorageBooleanParams {
    key: string;
    /** Default value to use when nothing is stored yet */
    defaultValue?: boolean;
}

/**
 * Boolean-specific wrapper around useStorage.
 *
 * Example:
 * const [hideHeaderBackgroundEnabled, setHideHeaderBackgroundEnabled] = useStorageBoolean({
 *   key: "feature_hide_header_background",
 *   defaultValue: true,
 * });
 */
export function useStorageBoolean({ key, defaultValue = false }: UseStorageBooleanParams) {
    return useStorage<boolean>(key, (val) =>
        typeof val === "undefined" ? defaultValue : Boolean(val)
    );
}
