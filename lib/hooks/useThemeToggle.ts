import { useEffect, useState } from "react";

import { containerPrefix } from "../constants";

export const useThemeToggle = () => {
    const [theme, setTheme] = useState(localStorage.getItem("theme-mode") || "dark");

    useEffect(() => {
        const targetElement = document.getElementById(`${containerPrefix}-root`);
        if (targetElement) {
            targetElement.setAttribute("data-theme", theme);
        }
        localStorage.setItem("theme-mode", theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme((prev) => (prev === "dark" ? "light" : "dark"));
    };

    return { theme, toggleTheme };
};
