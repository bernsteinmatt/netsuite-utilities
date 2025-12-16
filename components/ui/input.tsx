import { cn } from "@/lib/utils";
import * as React from "react";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
    return (
        <input
            type={type}
            data-slot="input"
            className={cn(
                "plasmo:file:text-foreground! plasmo:placeholder:text-muted-foreground! plasmo:selection:bg-primary plasmo:selection:text-primary-foreground! plasmo:dark:bg-input/30 plasmo:border-input! plasmo:h-9 plasmo:w-full plasmo:min-w-0 plasmo:rounded-md plasmo:border! plasmo:bg-transparent plasmo:px-3! plasmo:py-1! plasmo:text-base! plasmo:text-foreground! plasmo:shadow-xs plasmo:transition-[color,box-shadow] plasmo:outline-none plasmo:file:inline-flex plasmo:file:h-7 plasmo:file:border-0 plasmo:file:bg-transparent plasmo:file:text-sm plasmo:file:font-medium plasmo:disabled:pointer-events-none plasmo:disabled:cursor-not-allowed plasmo:disabled:opacity-50 plasmo:md:text-sm",
                "plasmo:focus-visible:border-ring plasmo:focus-visible:ring-ring/50 plasmo:focus-visible:ring-[3px]",
                "plasmo:aria-invalid:ring-destructive/20 plasmo:dark:aria-invalid:ring-destructive/40 plasmo:aria-invalid:border-destructive",
                "plasmo:dark:[color-scheme:dark]",
                className
            )}
            {...props}
        />
    );
}

export { Input };
