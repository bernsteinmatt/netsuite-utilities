import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const convertToCsv = (data: any[]): string => {
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

export const copyDataToClipboard = async ({ data, setCopied }) => {
    try {
        await navigator.clipboard.writeText(data);
        if (setCopied && typeof setCopied === "function") {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    } catch (err) {
        console.error("Failed to copy text: ", err);
    }
};
