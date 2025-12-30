import { cn } from "@/lib/utils";
import { Check, Copy } from "lucide-react";
import { useState } from "react";

import { Button } from "./button";

interface CopyButtonProps {
    value: string;
    className?: string;
    title?: string;
}

export const CopyButton = ({ value, className, title = "Copy to clipboard" }: CopyButtonProps) => {
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
            size="icon"
            onClick={(e) => {
                e.stopPropagation();
                handleCopy();
            }}
            className={cn("plasmo:cursor-pointer plasmo:size-8", className)}
            title={title}
        >
            {copied ? (
                <Check className="plasmo:size-4 plasmo:text-green-500" />
            ) : (
                <Copy className="plasmo:size-4" />
            )}
        </Button>
    );
};
