"use client";

import { cn } from "@/lib/utils";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import * as React from "react";

function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
    return (
        <SwitchPrimitive.Root
            data-slot="switch"
            className={cn(
                "plasmo:peer plasmo:data-[state=checked]:bg-primary plasmo:data-[state=unchecked]:bg-input plasmo:focus-visible:border-ring plasmo:focus-visible:ring-ring/50 plasmo:dark:data-[state=unchecked]:bg-input/80 plasmo:inline-flex plasmo:h-[1.15rem] plasmo:w-8 plasmo:shrink-0 plasmo:items-center plasmo:rounded-full plasmo:border plasmo:border-transparent plasmo:shadow-xs plasmo:transition-all plasmo:outline-none plasmo:focus-visible:ring-[3px] plasmo:disabled:cursor-not-allowed plasmo:disabled:opacity-50",
                className
            )}
            {...props}
        >
            <SwitchPrimitive.Thumb
                data-slot="switch-thumb"
                className={cn(
                    "plasmo:bg-background plasmo:dark:data-[state=unchecked]:bg-foreground plasmo:dark:data-[state=checked]:bg-primary-foreground plasmo:pointer-events-none plasmo:block plasmo:size-4 plasmo:rounded-full plasmo:ring-0 plasmo:transition-transform plasmo:data-[state=checked]:translate-x-[calc(100%-2px)] plasmo:data-[state=unchecked]:translate-x-0"
                )}
            />
        </SwitchPrimitive.Root>
    );
}

export { Switch };
