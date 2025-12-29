import { Storage } from "@plasmohq/storage";
import { useStorage } from "@plasmohq/storage/hook";

import {
    DEFAULT_DISPLAY_MODE_SETTINGS,
    DISPLAY_MODE_SETTINGS_KEY,
    type DisplayMode,
    type DisplayModeSettings,
} from "~lib/constants";

type ToolWithDisplayMode = keyof DisplayModeSettings;

// Shared storage instance for direct writes
const storage = new Storage();

export function useDisplayMode(tool: ToolWithDisplayMode) {
    const [settings, setSettings] = useStorage<DisplayModeSettings>(
        DISPLAY_MODE_SETTINGS_KEY,
        (val) => (typeof val === "undefined" ? DEFAULT_DISPLAY_MODE_SETTINGS : val)
    );

    const displayMode = settings?.[tool] ?? DEFAULT_DISPLAY_MODE_SETTINGS[tool];

    // Returns a Promise that resolves when storage is written
    const setDisplayMode = async (mode: DisplayMode): Promise<void> => {
        const newSettings = {
            ...settings,
            [tool]: mode,
        };
        // Use Plasmo Storage directly to ensure write completes before Promise resolves
        await storage.set(DISPLAY_MODE_SETTINGS_KEY, newSettings);
        // Also update local state
        setSettings(newSettings);
    };

    const toggleDisplayMode = () => {
        return setDisplayMode(displayMode === "dialog" ? "side-panel" : "dialog");
    };

    return { displayMode, setDisplayMode, toggleDisplayMode };
}
