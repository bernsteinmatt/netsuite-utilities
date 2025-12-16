"use client";

import { cn } from "@/lib/utils";
import * as SelectPrimitive from "@radix-ui/react-select";
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import * as React from "react";

function Select({ ...props }: React.ComponentProps<typeof SelectPrimitive.Root>) {
    return <SelectPrimitive.Root data-slot="select" {...props} />;
}

function SelectGroup({ ...props }: React.ComponentProps<typeof SelectPrimitive.Group>) {
    return <SelectPrimitive.Group data-slot="select-group" {...props} />;
}

function SelectValue({ ...props }: React.ComponentProps<typeof SelectPrimitive.Value>) {
    return <SelectPrimitive.Value data-slot="select-value" {...props} />;
}

function SelectTrigger({
    className,
    size = "default",
    children,
    ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
    size?: "sm" | "default";
}) {
    return (
        <SelectPrimitive.Trigger
            data-slot="select-trigger"
            data-size={size}
            className={cn(
                "plasmo:border-input plasmo:data-[placeholder]:text-muted-foreground plasmo:[&_svg:not([class*=text-])]:text-muted-foreground plasmo:focus-visible:border-ring plasmo:focus-visible:ring-ring/50 plasmo:aria-invalid:ring-destructive/20 plasmo:dark:aria-invalid:ring-destructive/40 plasmo:aria-invalid:border-destructive plasmo:dark:bg-input/30 plasmo:dark:hover:bg-input/50 plasmo:flex plasmo:w-fit plasmo:items-center plasmo:justify-between plasmo:gap-2 plasmo:rounded-md plasmo:border plasmo:bg-transparent plasmo:px-3 plasmo:py-2 plasmo:text-sm plasmo:whitespace-nowrap plasmo:shadow-xs plasmo:transition-[color,box-shadow] plasmo:outline-none plasmo:focus-visible:ring-[3px] plasmo:disabled:cursor-not-allowed plasmo:disabled:opacity-50 plasmo:data-[size=default]:h-9 plasmo:data-[size=sm]:h-8 plasmo:*:data-[slot=select-value]:line-clamp-1 plasmo:*:data-[slot=select-value]:flex plasmo:*:data-[slot=select-value]:items-center plasmo:*:data-[slot=select-value]:gap-2 plasmo:[&_svg]:pointer-events-none plasmo:[&_svg]:shrink-0 plasmo:[&_svg:not([class*=size-])]:size-4",
                className
            )}
            {...props}
        >
            {children}
            <SelectPrimitive.Icon asChild>
                <ChevronDownIcon className="plasmo:size-4 plasmo:opacity-50" />
            </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
    );
}

function SelectContent({
    className,
    children,
    position = "popper",
    align = "center",
    container,
    ...props
}: React.ComponentProps<typeof SelectPrimitive.Content> & {
    container?: HTMLElement | null;
}) {
    return (
        <SelectPrimitive.Portal container={container}>
            <SelectPrimitive.Content
                data-slot="select-content"
                className={cn(
                    "plasmo:bg-popover plasmo:text-popover-foreground plasmo:data-[state=open]:animate-in plasmo:data-[state=closed]:animate-out plasmo:data-[state=closed]:fade-out-0 plasmo:data-[state=open]:fade-in-0 plasmo:data-[state=closed]:zoom-out-95 plasmo:data-[state=open]:zoom-in-95 plasmo:data-[side=bottom]:slide-in-from-top-2 plasmo:data-[side=left]:slide-in-from-right-2 plasmo:data-[side=right]:slide-in-from-left-2 plasmo:data-[side=top]:slide-in-from-bottom-2 plasmo:relative plasmo:z-50 plasmo:max-h-(--radix-select-content-available-height) plasmo:min-w-[8rem] plasmo:origin-(--radix-select-content-transform-origin) plasmo:overflow-x-hidden plasmo:overflow-y-auto plasmo:rounded-md plasmo:border plasmo:shadow-md",
                    position === "popper" &&
                        "plasmo:data-[side=bottom]:translate-y-1 plasmo:data-[side=left]:-translate-x-1 plasmo:data-[side=right]:translate-x-1 plasmo:data-[side=top]:-translate-y-1",
                    className
                )}
                position={position}
                align={align}
                {...props}
            >
                <SelectScrollUpButton />
                <SelectPrimitive.Viewport
                    className={cn(
                        "plasmo:p-1",
                        position === "popper" &&
                            "plasmo:h-[var(--radix-select-trigger-height)] plasmo:w-full plasmo:min-w-[var(--radix-select-trigger-width)] plasmo:scroll-my-1"
                    )}
                >
                    {children}
                </SelectPrimitive.Viewport>
                <SelectScrollDownButton />
            </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
    );
}

function SelectLabel({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.Label>) {
    return (
        <SelectPrimitive.Label
            data-slot="select-label"
            className={cn(
                "plasmo:text-muted-foreground plasmo:px-2 plasmo:py-1.5 plasmo:text-xs",
                className
            )}
            {...props}
        />
    );
}

function SelectItem({
    className,
    children,
    ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
    return (
        <SelectPrimitive.Item
            data-slot="select-item"
            className={cn(
                "plasmo:focus:bg-accent plasmo:focus:text-accent-foreground plasmo:[&_svg:not([class*=text-])]:text-muted-foreground plasmo:relative plasmo:flex plasmo:w-full plasmo:cursor-default plasmo:items-center plasmo:gap-2 plasmo:rounded-sm plasmo:py-1.5 plasmo:pr-8 plasmo:pl-2 plasmo:text-sm plasmo:outline-hidden plasmo:select-none plasmo:data-[disabled]:pointer-events-none plasmo:data-[disabled]:opacity-50 plasmo:[&_svg]:pointer-events-none plasmo:[&_svg]:shrink-0 plasmo:[&_svg:not([class*=size-])]:size-4 plasmo:*:[span]:last:flex plasmo:*:[span]:last:items-center plasmo:*:[span]:last:gap-2",
                className
            )}
            {...props}
        >
            <span className="plasmo:absolute plasmo:right-2 plasmo:flex plasmo:size-3.5 plasmo:items-center plasmo:justify-center">
                <SelectPrimitive.ItemIndicator>
                    <CheckIcon className="plasmo:size-4" />
                </SelectPrimitive.ItemIndicator>
            </span>
            <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
        </SelectPrimitive.Item>
    );
}

function SelectSeparator({
    className,
    ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
    return (
        <SelectPrimitive.Separator
            data-slot="select-separator"
            className={cn(
                "plasmo:bg-border plasmo:pointer-events-none plasmo:-mx-1 plasmo:my-1 plasmo:h-px",
                className
            )}
            {...props}
        />
    );
}

function SelectScrollUpButton({
    className,
    ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
    return (
        <SelectPrimitive.ScrollUpButton
            data-slot="select-scroll-up-button"
            className={cn(
                "plasmo:flex plasmo:cursor-default plasmo:items-center plasmo:justify-center plasmo:py-1",
                className
            )}
            {...props}
        >
            <ChevronUpIcon className="plasmo:size-4" />
        </SelectPrimitive.ScrollUpButton>
    );
}

function SelectScrollDownButton({
    className,
    ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
    return (
        <SelectPrimitive.ScrollDownButton
            data-slot="select-scroll-down-button"
            className={cn(
                "plasmo:flex plasmo:cursor-default plasmo:items-center plasmo:justify-center plasmo:py-1",
                className
            )}
            {...props}
        >
            <ChevronDownIcon className="plasmo:size-4" />
        </SelectPrimitive.ScrollDownButton>
    );
}

export {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectScrollDownButton,
    SelectScrollUpButton,
    SelectSeparator,
    SelectTrigger,
    SelectValue,
};
