"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Command as CommandPrimitive } from "cmdk";
import { SearchIcon } from "lucide-react";
import * as React from "react";

function Command({ className, ...props }: React.ComponentProps<typeof CommandPrimitive>) {
    return (
        <CommandPrimitive
            data-slot="command"
            className={cn(
                "plasmo:bg-popover plasmo:text-popover-foreground plasmo:flex plasmo:h-full plasmo:w-full plasmo:flex-col plasmo:overflow-hidden plasmo:rounded-md",
                className
            )}
            {...props}
        />
    );
}

function CommandDialog({
    title = "Command Palette",
    description = "Search for a command to run...",
    children,
    className,
    showCloseButton = true,
    ...props
}: React.ComponentProps<typeof Dialog> & {
    title?: string;
    description?: string;
    className?: string;
    showCloseButton?: boolean;
}) {
    return (
        <Dialog {...props}>
            <DialogHeader className="plasmo:sr-only">
                <DialogTitle>{title}</DialogTitle>
                <DialogDescription>{description}</DialogDescription>
            </DialogHeader>
            <DialogContent
                className={cn("plasmo:overflow-hidden plasmo:p-0!", className)}
                showCloseButton={showCloseButton}
            >
                <Command className="plasmo:[&_[cmdk-group-heading]]:text-muted-foreground plasmo:**:data-[slot=command-input-wrapper]:h-12 plasmo:[&_[cmdk-group-heading]]:px-2! plasmo:[&_[cmdk-group-heading]]:font-medium plasmo:[&_[cmdk-group]]:px-2! plasmo:[&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 plasmo:[&_[cmdk-input-wrapper]_svg]:h-5 plasmo:[&_[cmdk-input-wrapper]_svg]:w-5 plasmo:[&_[cmdk-input]]:h-12 plasmo:[&_[cmdk-item]]:px-2! plasmo:[&_[cmdk-item]]:py-3! plasmo:[&_[cmdk-item]_svg]:h-5 plasmo:[&_[cmdk-item]_svg]:w-5">
                    {children}
                </Command>
            </DialogContent>
        </Dialog>
    );
}

function CommandInput({
    className,
    ...props
}: React.ComponentProps<typeof CommandPrimitive.Input>) {
    return (
        <div
            data-slot="command-input-wrapper"
            className="plasmo:flex plasmo:h-9 plasmo:items-center plasmo:gap-2 plasmo:border-b plasmo:px-3!"
        >
            <SearchIcon className="plasmo:size-4 plasmo:shrink-0 plasmo:opacity-50" />
            <CommandPrimitive.Input
                data-slot="command-input"
                className={cn(
                    "plasmo:placeholder:text-muted-foreground plasmo:flex plasmo:h-10 plasmo:w-full plasmo:rounded-md plasmo:bg-transparent plasmo:py-3! plasmo:text-sm plasmo:outline-hidden plasmo:disabled:cursor-not-allowed plasmo:disabled:opacity-50",
                    className
                )}
                {...props}
            />
        </div>
    );
}

function CommandList({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.List>) {
    return (
        <CommandPrimitive.List
            data-slot="command-list"
            className={cn(
                "plasmo:max-h-[300px] plasmo:scroll-py-1! plasmo:overflow-x-hidden plasmo:overflow-y-auto",
                className
            )}
            {...props}
        />
    );
}

function CommandEmpty({ ...props }: React.ComponentProps<typeof CommandPrimitive.Empty>) {
    return (
        <CommandPrimitive.Empty
            data-slot="command-empty"
            className="plasmo:py-6! plasmo:text-center plasmo:text-sm"
            {...props}
        />
    );
}

function CommandGroup({
    className,
    ...props
}: React.ComponentProps<typeof CommandPrimitive.Group>) {
    return (
        <CommandPrimitive.Group
            data-slot="command-group"
            className={cn(
                "plasmo:text-foreground plasmo:[&_[cmdk-group-heading]]:text-muted-foreground plasmo:overflow-hidden plasmo:p-1! plasmo:[&_[cmdk-group-heading]]:px-2! plasmo:[&_[cmdk-group-heading]]:py-1.5! plasmo:[&_[cmdk-group-heading]]:text-xs plasmo:[&_[cmdk-group-heading]]:font-medium",
                className
            )}
            {...props}
        />
    );
}

function CommandSeparator({
    className,
    ...props
}: React.ComponentProps<typeof CommandPrimitive.Separator>) {
    return (
        <CommandPrimitive.Separator
            data-slot="command-separator"
            className={cn("plasmo:bg-border plasmo:-mx-1 plasmo:h-px", className)}
            {...props}
        />
    );
}

function CommandItem({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Item>) {
    return (
        <CommandPrimitive.Item
            data-slot="command-item"
            className={cn(
                "plasmo:data-[selected=true]:bg-accent plasmo:data-[selected=true]:text-accent-foreground plasmo:[&_svg:not([class*=text-])]:text-muted-foreground plasmo:relative plasmo:flex plasmo:cursor-default plasmo:items-center plasmo:gap-2 plasmo:rounded-sm plasmo:px-2! plasmo:py-1.5! plasmo:text-sm plasmo:outline-hidden plasmo:select-none plasmo:data-[disabled=true]:pointer-events-none plasmo:data-[disabled=true]:opacity-50 plasmo:[&_svg]:pointer-events-none plasmo:[&_svg]:shrink-0 plasmo:[&_svg:not([class*=size-])]:size-4",
                className
            )}
            {...props}
        />
    );
}

function CommandShortcut({ className, ...props }: React.ComponentProps<"span">) {
    return (
        <span
            data-slot="command-shortcut"
            className={cn(
                "plasmo:text-muted-foreground plasmo:ml-auto plasmo:text-xs plasmo:tracking-widest",
                className
            )}
            {...props}
        />
    );
}

export {
    Command,
    CommandDialog,
    CommandInput,
    CommandList,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandShortcut,
    CommandSeparator,
};
