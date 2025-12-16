import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, convertToCsv, copyDataToClipboard } from "@/lib/utils";
import { Check, Copy } from "lucide-react";
import { useState } from "react";

import { DATA_FORMAT_OPTIONS } from "./constants";

export const CopyDropdown = ({ data, isFetching }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = ({ type }) => {
        if (!data?.length) {
            console.error("No data available for download");
            return;
        }

        const copyData =
            type === "json" ? JSON.stringify(data.slice(0, 5000), null, 2) : convertToCsv(data);

        void copyDataToClipboard({ data: copyData, setCopied });
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
                {copied ? (
                    <Check className="plasmo:size-5 plasmo:text-green-500" />
                ) : (
                    <Copy className="plasmo:size-5" />
                )}
            </DropdownMenuTrigger>
            <DropdownMenuContent className="plasmo:z-1002 plasmo:py-1!">
                {DATA_FORMAT_OPTIONS.map((item) => (
                    <DropdownMenuItem
                        key={item.id}
                        className="plasmo:px-4! plasmo:py-2!"
                        onSelect={() => {
                            handleCopy({ type: item.id });
                        }}
                    >
                        {item.label}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
