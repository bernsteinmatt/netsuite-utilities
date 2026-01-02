import { CopyButton } from "@/components/ui/copy-button";
import { ChevronDown, ChevronRight } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";

export interface JsonNodeProps {
    name?: string;
    value: unknown;
    searchTerm: string;
    defaultExpanded?: boolean;
    forceExpanded?: boolean;
}

/**
 * Collapsible JSON node component for displaying hierarchical data
 */
export const JsonNode = ({
    name,
    value,
    searchTerm,
    defaultExpanded = false,
    forceExpanded,
}: JsonNodeProps) => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    // Sync with forceExpanded when it changes
    useEffect(() => {
        if (forceExpanded !== undefined) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setIsExpanded(forceExpanded);
        }
    }, [forceExpanded]);

    const highlightMatch = (text: string): React.ReactNode => {
        if (!searchTerm) return text;

        const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
        const parts = text.split(regex);

        return parts.map((part, i) =>
            regex.test(part) ? (
                <span key={i} className="plasmo:bg-yellow-500/50 plasmo:rounded plasmo:px-0.5">
                    {part}
                </span>
            ) : (
                part
            )
        );
    };

    if (value === null || value === undefined) {
        return (
            <div className="plasmo:flex plasmo:items-center plasmo:gap-1 plasmo:py-px!">
                {name && (
                    <span className="plasmo:text-black plasmo:dark:text-purple-400">
                        {highlightMatch(name)}:
                    </span>
                )}
                <span className="plasmo:text-rose-700 plasmo:dark:text-red-400 plasmo:italic">
                    null
                </span>
            </div>
        );
    }

    if (typeof value !== "object") {
        const stringValue = String(value);
        return (
            <div className="plasmo:flex plasmo:items-start plasmo:gap-1 plasmo:py-px!">
                {name && (
                    <span className="plasmo:text-black plasmo:dark:text-purple-400 plasmo:shrink-0">
                        {highlightMatch(name)}:
                    </span>
                )}
                <span className="plasmo:text-emerald-700 plasmo:dark:text-green-400 plasmo:whitespace-nowrap">
                    {highlightMatch(stringValue)}
                </span>
            </div>
        );
    }

    const isArray = Array.isArray(value);
    const entries = isArray
        ? (value as unknown[]).map((v, i) => [String(i), v] as [string, unknown])
        : Object.entries(value as Record<string, unknown>);
    const isEmpty = entries.length === 0;

    if (isEmpty) {
        return (
            <div className="plasmo:flex plasmo:items-center plasmo:gap-1 plasmo:py-px!">
                {name && (
                    <span className="plasmo:text-black plasmo:dark:text-purple-400">
                        {highlightMatch(name)}:
                    </span>
                )}
                <span className="plasmo:text-muted-foreground">{isArray ? "[]" : "{}"}</span>
            </div>
        );
    }

    return (
        <div className="plasmo:flex plasmo:flex-col">
            <div className="plasmo:flex plasmo:items-center plasmo:group plasmo:flex-row plasmo:gap-2">
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="plasmo:flex plasmo:items-center plasmo:gap-1 plasmo:py-px! plasmo:cursor-pointer plasmo:hover:bg-white/5 plasmo:rounded plasmo:text-left"
                >
                    {isExpanded ? (
                        <ChevronDown className="plasmo:size-4 plasmo:shrink-0" />
                    ) : (
                        <ChevronRight className="plasmo:size-4 plasmo:shrink-0" />
                    )}
                    {name && (
                        <span className="plasmo:text-black plasmo:dark:text-purple-400">
                            {highlightMatch(name)}
                        </span>
                    )}
                    <span className="plasmo:text-muted-foreground plasmo:text-sm">
                        {isArray ? `[${entries.length}]` : `{${entries.length}}`}
                    </span>
                </button>
                <CopyButton
                    value={JSON.stringify(value, null, 2)}
                    className="plasmo:size-6 plasmo:opacity-0 plasmo:group-hover:opacity-100 plasmo:transition-opacity"
                    title={`Copy ${name || (isArray ? "array" : "object")}`}
                />
            </div>
            {isExpanded && (
                <div className="plasmo:ml-4! plasmo:pl-2! plasmo:border-l plasmo:border-gray-700">
                    {entries.map(([key, val]) => (
                        <JsonNode
                            key={key}
                            name={key}
                            value={val}
                            searchTerm={searchTerm}
                            defaultExpanded={!!searchTerm}
                            forceExpanded={forceExpanded}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
