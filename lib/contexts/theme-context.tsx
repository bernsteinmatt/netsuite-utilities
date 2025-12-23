import React, { createContext, useContext, useEffect, useState } from "react";

import { Storage } from "@plasmohq/storage";

type Theme = "light" | "dark-grey";

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
const storage = new Storage();

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>("dark-grey");
    const [isLoaded, setIsLoaded] = useState(false);

    // Load theme from storage on mount
    useEffect(() => {
        storage.get("theme-mode").then((stored) => {
            if (stored) {
                setTheme(stored as Theme);
            }
            setIsLoaded(true);
        });
    }, []);

    // Save and apply theme whenever it changes
    useEffect(() => {
        storage.set("theme-mode", theme);

        // Apply theme class to document root for global styling
        document.documentElement.classList.remove("light", "dark", "dark-grey");
        document.documentElement.classList.add(theme);

        // Also apply to specific containers if they exist
        const containers = [
            document.getElementById("netsuite-chrome-extension-root"),
            document.getElementById("netsuite-utilities-parent-root"),
        ];

        containers.forEach((container) => {
            if (container) {
                container.classList.remove("light", "dark", "dark-grey");
                container.classList.add(theme);
            }
        });
    }, [theme]);

    const toggleTheme = () => {
        setTheme((prev) => (prev === "light" ? "dark-grey" : "light"));
    };

    // Don't render children until theme is loaded to prevent flash
    if (!isLoaded) {
        return null;
    }

    return (
        <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
}
