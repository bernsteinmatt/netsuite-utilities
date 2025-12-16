"use client";

import { cn } from "@/lib/utils";
import * as SeparatorPrimitive from "@radix-ui/react-separator";
import * as React from "react";

function Separator({
    className,
    orientation = "horizontal",
    decorative = true,
    ...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root>) {
    return (
        <SeparatorPrimitive.Root
            data-slot="separator"
            decorative={decorative}
            orientation={orientation}
            className={cn(
                "plasmo:bg-border plasmo:shrink-0 plasmo:data-[orientation=horizontal]:h-px plasmo:data-[orientation=horizontal]:w-full plasmo:data-[orientation=vertical]:h-full plasmo:data-[orientation=vertical]:w-px",
                className
            )}
            {...props}
        />
    );
}

export { Separator };
