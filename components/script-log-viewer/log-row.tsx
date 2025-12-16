import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, ChevronDown, ChevronRight, Copy, ExternalLink } from "lucide-react";
import React, { useCallback, useState } from "react";
import { format as sqlFormat } from "sql-formatter";

import { LOG_TYPE_COLORS, SQL_FUNCTIONS, SQL_KEYWORDS } from "./constants";

interface LogEntry {
    id: string;
    date: string;
    type: string;
    script_name?: string;
    script_id?: string;
    title: string;
    detail: string;
    user: string;
}

interface LogRowProps {
    row: LogEntry;
    defaultExpanded?: boolean;
}

const CopyButton = ({ value, className }: { value: string; className?: string }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    return (
        <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => {
                e.stopPropagation();
                handleCopy();
            }}
            className={cn("plasmo:cursor-pointer", className)}
        >
            {copied ? (
                <Check className="plasmo:size-4 plasmo:text-green-500" />
            ) : (
                <Copy className="plasmo:size-4" />
            )}
        </Button>
    );
};

const formatDate = (dateString: string): string => {
    try {
        const date = new Date(dateString);
        return date.toLocaleString();
    } catch {
        return dateString;
    }
};

const ERROR_KEYWORDS = ["search error occurred", "suitescripterror"];

const isSqlQuery = (value: string): boolean => {
    const normalizedValue = value.trim().toLowerCase();
    const isValidSql = normalizedValue.includes("select") && normalizedValue.includes("from");
    const containsError = ERROR_KEYWORDS.some((keyword) => normalizedValue.includes(keyword));
    return isValidSql && !containsError;
};

const isJson = (value: string): boolean => {
    if (!value || typeof value !== "string") return false;
    return (
        (value.startsWith("{") && value.endsWith("}")) ||
        (value.startsWith("[") && value.endsWith("]"))
    );
};

const formatContent = (value: string): { formatted: string; type: "json" | "sql" | "text" } => {
    if (!value) return { formatted: value, type: "text" };

    if (isJson(value)) {
        try {
            const parsed = JSON.parse(value);
            return { formatted: JSON.stringify(parsed, null, 2), type: "json" };
        } catch {
            return { formatted: value, type: "text" };
        }
    }

    if (isSqlQuery(value)) {
        try {
            const formatted = sqlFormat(value, {
                language: "sql",
                tabWidth: 4,
                keywordCase: "upper",
                functionCase: "upper",
                linesBetweenQueries: 2,
                expressionWidth: 75,
            });
            return { formatted, type: "sql" };
        } catch {
            // If formatting fails, still treat it as SQL for highlighting
            return { formatted: value, type: "sql" };
        }
    }

    return { formatted: value, type: "text" };
};

const highlightJson = (json: string): React.ReactNode[] => {
    const tokens: React.ReactNode[] = [];
    let i = 0;

    // Regex patterns for JSON tokens
    const patterns = [
        { type: "string", regex: /"(?:[^"\\]|\\.)*"/ },
        { type: "number", regex: /-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/ },
        { type: "boolean", regex: /\b(true|false)\b/ },
        { type: "null", regex: /\bnull\b/ },
        { type: "punctuation", regex: /[{}[\]:,]/ },
        { type: "whitespace", regex: /\s+/ },
    ];

    while (i < json.length) {
        let matched = false;

        for (const { type, regex } of patterns) {
            const match = json.slice(i).match(new RegExp(`^${regex.source}`));
            if (match) {
                const value = match[0];
                const key = `${i}-${type}`;

                if (type === "string") {
                    // Check if this string is a key (followed by colon)
                    const afterString = json.slice(i + value.length).trimStart();
                    const isKey = afterString.startsWith(":");

                    tokens.push(
                        <span
                            key={key}
                            className={
                                isKey
                                    ? "plasmo:text-purple-900 plasmo:dark:text-purple-400"
                                    : "plasmo:text-emerald-700 plasmo:dark:text-green-400"
                            }
                        >
                            {value}
                        </span>
                    );
                } else if (type === "number") {
                    tokens.push(
                        <span
                            key={key}
                            className="plasmo:text-amber-700 plasmo:dark:text-orange-400"
                        >
                            {value}
                        </span>
                    );
                } else if (type === "boolean") {
                    tokens.push(
                        <span key={key} className="plasmo:text-blue-700 plasmo:dark:text-blue-400">
                            {value}
                        </span>
                    );
                } else if (type === "null") {
                    tokens.push(
                        <span key={key} className="plasmo:text-rose-700 plasmo:dark:text-red-400">
                            {value}
                        </span>
                    );
                } else if (type === "punctuation") {
                    tokens.push(
                        <span key={key} className="plasmo:text-muted-foreground">
                            {value}
                        </span>
                    );
                } else {
                    tokens.push(<span key={key}>{value}</span>);
                }

                i += value.length;
                matched = true;
                break;
            }
        }

        if (!matched) {
            tokens.push(<span key={i}>{json[i]}</span>);
            i++;
        }
    }

    return tokens;
};

const highlightSql = (sql: string): React.ReactNode[] => {
    const tokens: React.ReactNode[] = [];
    let i = 0;

    while (i < sql.length) {
        // Skip whitespace
        if (/\s/.test(sql[i])) {
            let whitespace = "";
            while (i < sql.length && /\s/.test(sql[i])) {
                whitespace += sql[i];
                i++;
            }
            tokens.push(<span key={`ws-${i}`}>{whitespace}</span>);
            continue;
        }

        // String literals (single quotes)
        if (sql[i] === "'") {
            let str = "'";
            i++;
            while (i < sql.length && sql[i] !== "'") {
                if (sql[i] === "'" && sql[i + 1] === "'") {
                    str += "''";
                    i += 2;
                } else {
                    str += sql[i];
                    i++;
                }
            }
            if (i < sql.length) {
                str += "'";
                i++;
            }
            tokens.push(
                <span
                    key={`str-${i}`}
                    className="plasmo:text-emerald-700 plasmo:dark:text-green-400"
                >
                    {str}
                </span>
            );
            continue;
        }

        // Numbers
        if (/\d/.test(sql[i]) || (sql[i] === "." && /\d/.test(sql[i + 1] || ""))) {
            let num = "";
            while (i < sql.length && /[\d.]/.test(sql[i])) {
                num += sql[i];
                i++;
            }
            tokens.push(
                <span
                    key={`num-${i}`}
                    className="plasmo:text-amber-700 plasmo:dark:text-orange-400"
                >
                    {num}
                </span>
            );
            continue;
        }

        // Identifiers and keywords
        if (/[a-zA-Z_]/.test(sql[i])) {
            let word = "";
            while (i < sql.length && /[a-zA-Z0-9_]/.test(sql[i])) {
                word += sql[i];
                i++;
            }
            const upperWord = word.toUpperCase();
            const isKeyword = SQL_KEYWORDS.has(upperWord);
            const isFunction = SQL_FUNCTIONS.has(upperWord);
            tokens.push(
                <span
                    key={`word-${i}`}
                    className={
                        isKeyword
                            ? "plasmo:text-purple-800 plasmo:dark:text-purple-400 plasmo:font-semibold"
                            : isFunction
                              ? "plasmo:text-blue-700 plasmo:dark:text-blue-400"
                              : undefined
                    }
                >
                    {word}
                </span>
            );
            continue;
        }

        // Operators and punctuation
        const opMatch = sql.slice(i).match(/^(>=|<=|<>|!=|:=|=>|[+\-*/%=<>(),.;|])/);
        if (opMatch) {
            tokens.push(
                <span key={`op-${i}`} className="plasmo:text-muted-foreground">
                    {opMatch[0]}
                </span>
            );
            i += opMatch[0].length;
            continue;
        }

        // Any other character
        tokens.push(<span key={`char-${i}`}>{sql[i]}</span>);
        i++;
    }

    return tokens;
};

const DetailContent = ({ detail }: { detail: string }) => {
    const { formatted, type } = formatContent(detail);

    const highlightedContent =
        type === "json"
            ? highlightJson(formatted)
            : type === "sql"
              ? highlightSql(formatted)
              : formatted;

    return (
        <div className="plasmo:relative plasmo:group">
            <CopyButton
                value={formatted}
                className="plasmo:absolute plasmo:top-2 plasmo:right-2 plasmo:opacity-0 plasmo:group-hover:opacity-100 plasmo:transition-opacity plasmo:z-10"
            />
            <pre
                className={cn(
                    "plasmo:text-sm plasmo:p-4! plasmo:rounded-md plasmo:overflow-x-auto plasmo:whitespace-pre-wrap",
                    (type === "json" || type === "sql") && "plasmo:dark:bg-card plasmo:bg-gray-100"
                )}
            >
                <code>{highlightedContent}</code>
            </pre>
        </div>
    );
};

export const LogRow = ({ row, defaultExpanded = false }: LogRowProps) => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    const handleScriptClick = useCallback(() => {
        if (!row.script_id) return;
        window.open(`/app/common/scripting/script.nl?id=${row.script_id}`, "_blank");
    }, [row.script_id]);

    const typeColorClass = LOG_TYPE_COLORS[row.type] || "plasmo:bg-gray-500 plasmo:text-white";

    const handleToggle = () => setIsExpanded(!isExpanded);

    return (
        <div className="plasmo:border-b-2 plasmo:border-card">
            {/* Header row */}
            <div className="plasmo:flex plasmo:items-center plasmo:gap-4 plasmo:px-4! plasmo:py-3! plasmo:hover:bg-card/30 plasmo:transition-colors">
                <Button
                    variant="ghost"
                    size="icon-sm"
                    className="plasmo:shrink-0 plasmo:size-6 plasmo:cursor-pointer"
                    onClick={handleToggle}
                >
                    {isExpanded ? (
                        <ChevronDown className="plasmo:size-4" />
                    ) : (
                        <ChevronRight className="plasmo:size-4" />
                    )}
                </Button>

                <span
                    className={cn(
                        "plasmo:px-2! plasmo:py-1! plasmo:rounded plasmo:text-xs plasmo:font-semibold plasmo:shrink-0 plasmo:cursor-pointer",
                        typeColorClass
                    )}
                    onClick={handleToggle}
                >
                    {row.type}
                </span>

                {row.script_name && (
                    <span
                        className={cn(
                            "plasmo:text-sm plasmo:shrink-0 plasmo:text-muted-foreground",
                            row.script_id &&
                                "plasmo:hover:underline plasmo:cursor-pointer plasmo:hover:text-blue-700 plasmo:dark:hover:text-blue-400"
                        )}
                        onClick={(e) => {
                            if (row.script_id) {
                                e.stopPropagation();
                                handleScriptClick();
                            }
                        }}
                    >
                        {row.script_name}
                        {row.script_id && (
                            <ExternalLink className="plasmo:inline plasmo:size-3 plasmo:ml-1" />
                        )}
                    </span>
                )}

                <span
                    className="plasmo:text-sm plasmo:shrink-0 plasmo:cursor-pointer"
                    onClick={handleToggle}
                >
                    {formatDate(row.date)}
                </span>

                {/* Title - clicking does NOT toggle expand */}
                <span className="plasmo:text-sm plasmo:truncate plasmo:flex-1 plasmo:select-text">
                    {row.title}
                </span>
            </div>

            {/* Expanded content */}
            {isExpanded && (
                <div className="plasmo:px-4 plasmo:pb-4 plasmo:pt-0">
                    {row.detail && <DetailContent detail={row.detail} />}
                </div>
            )}
        </div>
    );
};
