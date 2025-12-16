import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";

import { useTheme } from "~lib/contexts/theme-context";

export function ThemeSelector() {
    const { theme, toggleTheme } = useTheme();

    return (
        <Button onClick={toggleTheme} variant="ghost" size="sm">
            {theme === "dark-grey" ? (
                <Sun className="plasmo:size-5" />
            ) : (
                <Moon className="plasmo:size-5" />
            )}
        </Button>
    );
}
