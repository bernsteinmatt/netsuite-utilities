import { useStorage } from "@plasmohq/storage/hook";

import {
    DEFAULT_DISPLAY_MODE_SETTINGS,
    DISPLAY_MODE_SETTINGS_KEY,
    type DisplayMode,
    type DisplayModeSettings,
} from "~lib/constants";

type ToolWithDisplayMode = keyof DisplayModeSettings;

export function useDisplayMode(tool: ToolWithDisplayMode) {
    const [settings, setSettings] = useStorage<DisplayModeSettings>(
        DISPLAY_MODE_SETTINGS_KEY,
        (val) => (typeof val === "undefined" ? DEFAULT_DISPLAY_MODE_SETTINGS : val)
    );

    const displayMode = settings?.[tool] ?? DEFAULT_DISPLAY_MODE_SETTINGS[tool];

    const setDisplayMode = (mode: DisplayMode) => {
        setSettings({
            ...settings,
            [tool]: mode,
        });
    };

    const toggleDisplayMode = () => {
        setDisplayMode(displayMode === "dialog" ? "side-panel" : "dialog");
    };

    return { displayMode, setDisplayMode, toggleDisplayMode };
}
