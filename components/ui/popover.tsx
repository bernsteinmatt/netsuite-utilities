import { cn } from "@/lib/utils";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import * as React from "react";

function Popover({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Root>) {
    return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

function PopoverTrigger({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
    return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}

function PopoverContent({
    className,
    align = "center",
    sideOffset = 4,
    ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content>) {
    return (
        <PopoverPrimitive.Portal>
            <PopoverPrimitive.Content
                data-slot="popover-content"
                align={align}
                sideOffset={sideOffset}
                className={cn(
                    "plasmo:bg-popover plasmo:text-popover-foreground plasmo:data-[state=open]:animate-in plasmo:data-[state=closed]:animate-out plasmo:data-[state=closed]:fade-out-0 plasmo:data-[state=open]:fade-in-0 plasmo:data-[state=closed]:zoom-out-95 plasmo:data-[state=open]:zoom-in-95 plasmo:data-[side=bottom]:slide-in-from-top-2 plasmo:data-[side=left]:slide-in-from-right-2 plasmo:data-[side=right]:slide-in-from-left-2 plasmo:data-[side=top]:slide-in-from-bottom-2 plasmo:z-50 plasmo:w-72 plasmo:origin-(--radix-popover-content-transform-origin) plasmo:rounded-md plasmo:border plasmo:p-4! plasmo:shadow-md plasmo:outline-hidden",
                    className
                )}
                {...props}
            />
        </PopoverPrimitive.Portal>
    );
}

function PopoverAnchor({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Anchor>) {
    return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />;
}

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor };
