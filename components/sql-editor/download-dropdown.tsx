import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, convertToCsv } from "@/lib/utils";
import { DownloadIcon } from "lucide-react";

import { DATA_FORMAT_OPTIONS } from "./constants";

export const DownloadDropdown = ({ data, isFetching }) => {
    const handleDownload = ({ type }) => {
        if (!data?.length) {
            console.error("No data available for download");
            return;
        }

        try {
            let dataStr = "";

            if (type === "json") {
                dataStr = JSON.stringify(data, null, 2);
            } else if (type === "csv") {
                // Convert JSON to CSV
                dataStr = convertToCsv(data);
            }

            // Create and trigger download
            const blob = new Blob([dataStr], { type: "text/plain" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");

            const fileNameBase = ["netsuite-utilities", new Date().toISOString()].join("-");
            a.href = url;
            a.download = `${fileNameBase}.${type}`;
            document.body.appendChild(a);
            a.click();

            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 0);
        } catch (error) {
            console.error(`Failed to download ${type} file:`, error);
            alert(`Failed to download ${type} file. Please try again.`);
        }
    };

    const isDisabled = !!(isFetching || !data?.length);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                disabled={isDisabled}
                className={cn(
                    "plasmo:inline-flex plasmo:items-center plasmo:justify-center plasmo:rounded-md plasmo:size-9 plasmo:cursor-pointer plasmo:hover:bg-accent plasmo:hover:text-accent-foreground",
                    isDisabled && "plasmo:opacity-50 plasmo:pointer-events-none"
                )}
            >
                <DownloadIcon className="plasmo:size-5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="plasmo:z-1002 plasmo:py-1!">
                {DATA_FORMAT_OPTIONS.map((item) => (
                    <DropdownMenuItem
                        key={item.id}
                        className="plasmo:px-4! plasmo:py-2!"
                        onSelect={() => {
                            handleDownload({ type: item.id });
                        }}
                    >
                        {item.label}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
