import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const convertToCsv = (data: Record<string, unknown>[]): string => {
    if (!data || data.length === 0) return "";

    const headers = Object.keys(data[0]);
    const csvRows = data.map((row) =>
        headers
            .map((header) => {
                const escaped = `${row[header]}`.replace(/"/g, '\\"');
                return `"${escaped}"`;
            })
            .join(",")
    );
    return `${headers.join(",")}\n${csvRows.join("\n")}`;
};

interface CopyToClipboardOptions {
    data: string;
    setCopied?: (copied: boolean) => void;
}

export const copyDataToClipboard = async ({ data, setCopied }: CopyToClipboardOptions) => {
    try {
        await navigator.clipboard.writeText(data);
        if (setCopied) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    } catch (err) {
        console.error("Failed to copy text: ", err);
    }
};

// Convert milliseconds to seconds (rounded to 2 decimal places)
export const formatTime = (ms: number): string => {
    const seconds = ms / 1000;
    return `${seconds.toFixed(2)}s`;
};
