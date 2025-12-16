import { cn } from "@/lib/utils";
import * as LabelPrimitive from "@radix-ui/react-label";
import * as React from "react";

function Label({ className, ...props }: React.ComponentProps<typeof LabelPrimitive.Root>) {
    return (
        <LabelPrimitive.Root
            data-slot="label"
            className={cn(
                "plasmo:flex plasmo:items-center plasmo:gap-2 plasmo:text-sm plasmo:leading-none plasmo:font-medium plasmo:select-none plasmo:group-data-[disabled=true]:pointer-events-none plasmo:group-data-[disabled=true]:opacity-50 plasmo:peer-disabled:cursor-not-allowed plasmo:peer-disabled:opacity-50",
                className
            )}
            {...props}
        />
    );
}

export { Label };
