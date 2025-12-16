"use client";

import { cn } from "@/lib/utils";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { CheckIcon, ChevronRightIcon, CircleIcon } from "lucide-react";
import * as React from "react";

function DropdownMenu({ ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Root>) {
    return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />;
}

function DropdownMenuPortal({
    ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Portal>) {
    return <DropdownMenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />;
}

function DropdownMenuTrigger({
    ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>) {
    return <DropdownMenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props} />;
}

function DropdownMenuContent({
    className,
    sideOffset = 4,
    container,
    ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content> & {
    container?: HTMLElement | null;
}) {
    return (
        <DropdownMenuPrimitive.Portal container={container}>
            <DropdownMenuPrimitive.Content
                data-slot="dropdown-menu-content"
                sideOffset={sideOffset}
                className={cn(
                    "plasmo:bg-popover plasmo:text-popover-foreground plasmo:data-[state=open]:animate-in plasmo:data-[state=closed]:animate-out plasmo:data-[state=closed]:fade-out-0 plasmo:data-[state=open]:fade-in-0 plasmo:data-[state=closed]:zoom-out-95 plasmo:data-[state=open]:zoom-in-95 plasmo:data-[side=bottom]:slide-in-from-top-2 plasmo:data-[side=left]:slide-in-from-right-2 plasmo:data-[side=right]:slide-in-from-left-2 plasmo:data-[side=top]:slide-in-from-bottom-2 plasmo:z-50 plasmo:max-h-(--radix-dropdown-menu-content-available-height) plasmo:min-w-[8rem] plasmo:origin-(--radix-dropdown-menu-content-transform-origin) plasmo:overflow-x-hidden plasmo:overflow-y-auto plasmo:rounded-md plasmo:border plasmo:p-1 plasmo:shadow-md",
                    className
                )}
                {...props}
            />
        </DropdownMenuPrimitive.Portal>
    );
}

function DropdownMenuGroup({ ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Group>) {
    return <DropdownMenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />;
}

function DropdownMenuItem({
    className,
    inset,
    variant = "default",
    ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean;
    variant?: "default" | "destructive";
}) {
    return (
        <DropdownMenuPrimitive.Item
            data-slot="dropdown-menu-item"
            data-inset={inset}
            data-variant={variant}
            className={cn(
                "plasmo:focus:bg-accent plasmo:focus:text-accent-foreground plasmo:data-[variant=destructive]:text-destructive plasmo:data-[variant=destructive]:focus:bg-destructive/10 plasmo:dark:data-[variant=destructive]:focus:bg-destructive/20 plasmo:data-[variant=destructive]:focus:text-destructive plasmo:data-[variant=destructive]:*:[svg]:!text-destructive plasmo:[&_svg:not([class*=text-])]:text-muted-foreground plasmo:relative plasmo:flex plasmo:cursor-default plasmo:items-center plasmo:gap-2 plasmo:rounded-sm plasmo:px-2 plasmo:py-1.5 plasmo:text-sm plasmo:outline-hidden plasmo:select-none plasmo:data-[disabled]:pointer-events-none plasmo:data-[disabled]:opacity-50 plasmo:data-[inset]:pl-8 plasmo:[&_svg]:pointer-events-none plasmo:[&_svg]:shrink-0 plasmo:[&_svg:not([class*=size-])]:size-4",
                className
            )}
            {...props}
        />
    );
}

function DropdownMenuCheckboxItem({
    className,
    children,
    checked,
    ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>) {
    return (
        <DropdownMenuPrimitive.CheckboxItem
            data-slot="dropdown-menu-checkbox-item"
            className={cn(
                "plasmo:focus:bg-accent plasmo:focus:text-accent-foreground plasmo:relative plasmo:flex plasmo:cursor-default plasmo:items-center plasmo:gap-2 plasmo:rounded-sm plasmo:py-1.5 plasmo:pr-2 plasmo:pl-8 plasmo:text-sm plasmo:outline-hidden plasmo:select-none plasmo:data-[disabled]:pointer-events-none plasmo:data-[disabled]:opacity-50 plasmo:[&_svg]:pointer-events-none plasmo:[&_svg]:shrink-0 plasmo:[&_svg:not([class*=size-])]:size-4",
                className
            )}
            checked={checked}
            {...props}
        >
            <span className="plasmo:pointer-events-none plasmo:absolute plasmo:left-2 plasmo:flex plasmo:size-3.5 plasmo:items-center plasmo:justify-center">
                <DropdownMenuPrimitive.ItemIndicator>
                    <CheckIcon className="plasmo:size-4" />
                </DropdownMenuPrimitive.ItemIndicator>
            </span>
            {children}
        </DropdownMenuPrimitive.CheckboxItem>
    );
}

function DropdownMenuRadioGroup({
    ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>) {
    return <DropdownMenuPrimitive.RadioGroup data-slot="dropdown-menu-radio-group" {...props} />;
}

function DropdownMenuRadioItem({
    className,
    children,
    ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem>) {
    return (
        <DropdownMenuPrimitive.RadioItem
            data-slot="dropdown-menu-radio-item"
            className={cn(
                "plasmo:focus:bg-accent plasmo:focus:text-accent-foreground plasmo:relative plasmo:flex plasmo:cursor-default plasmo:items-center plasmo:gap-2 plasmo:rounded-sm plasmo:py-1.5 plasmo:pr-2 plasmo:pl-8 plasmo:text-sm plasmo:outline-hidden plasmo:select-none plasmo:data-[disabled]:pointer-events-none plasmo:data-[disabled]:opacity-50 plasmo:[&_svg]:pointer-events-none plasmo:[&_svg]:shrink-0 plasmo:[&_svg:not([class*=size-])]:size-4",
                className
            )}
            {...props}
        >
            <span className="plasmo:pointer-events-none plasmo:absolute plasmo:left-2 plasmo:flex plasmo:size-3.5 plasmo:items-center plasmo:justify-center">
                <DropdownMenuPrimitive.ItemIndicator>
                    <CircleIcon className="plasmo:size-2 plasmo:fill-current" />
                </DropdownMenuPrimitive.ItemIndicator>
            </span>
            {children}
        </DropdownMenuPrimitive.RadioItem>
    );
}

function DropdownMenuLabel({
    className,
    inset,
    ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean;
}) {
    return (
        <DropdownMenuPrimitive.Label
            data-slot="dropdown-menu-label"
            data-inset={inset}
            className={cn(
                "plasmo:px-2 plasmo:py-1.5 plasmo:text-sm plasmo:font-medium plasmo:data-[inset]:pl-8",
                className
            )}
            {...props}
        />
    );
}

function DropdownMenuSeparator({
    className,
    ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
    return (
        <DropdownMenuPrimitive.Separator
            data-slot="dropdown-menu-separator"
            className={cn("plasmo:bg-border plasmo:-mx-1 plasmo:my-1 plasmo:h-px", className)}
            {...props}
        />
    );
}

function DropdownMenuShortcut({ className, ...props }: React.ComponentProps<"span">) {
    return (
        <span
            data-slot="dropdown-menu-shortcut"
            className={cn(
                "plasmo:text-muted-foreground plasmo:ml-auto plasmo:text-xs plasmo:tracking-widest",
                className
            )}
            {...props}
        />
    );
}

function DropdownMenuSub({ ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Sub>) {
    return <DropdownMenuPrimitive.Sub data-slot="dropdown-menu-sub" {...props} />;
}

function DropdownMenuSubTrigger({
    className,
    inset,
    children,
    ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean;
}) {
    return (
        <DropdownMenuPrimitive.SubTrigger
            data-slot="dropdown-menu-sub-trigger"
            data-inset={inset}
            className={cn(
                "plasmo:focus:bg-accent plasmo:focus:text-accent-foreground plasmo:data-[state=open]:bg-accent plasmo:data-[state=open]:text-accent-foreground plasmo:[&_svg:not([class*=text-])]:text-muted-foreground plasmo:flex plasmo:cursor-default plasmo:items-center plasmo:gap-2 plasmo:rounded-sm plasmo:px-2 plasmo:py-1.5 plasmo:text-sm plasmo:outline-hidden plasmo:select-none plasmo:data-[inset]:pl-8 plasmo:[&_svg]:pointer-events-none plasmo:[&_svg]:shrink-0 plasmo:[&_svg:not([class*=size-])]:size-4",
                className
            )}
            {...props}
        >
            {children}
            <ChevronRightIcon className="plasmo:ml-auto plasmo:size-4" />
        </DropdownMenuPrimitive.SubTrigger>
    );
}

function DropdownMenuSubContent({
    className,
    ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubContent>) {
    return (
        <DropdownMenuPrimitive.SubContent
            data-slot="dropdown-menu-sub-content"
            className={cn(
                "plasmo:bg-popover plasmo:text-popover-foreground plasmo:data-[state=open]:animate-in plasmo:data-[state=closed]:animate-out plasmo:data-[state=closed]:fade-out-0 plasmo:data-[state=open]:fade-in-0 plasmo:data-[state=closed]:zoom-out-95 plasmo:data-[state=open]:zoom-in-95 plasmo:data-[side=bottom]:slide-in-from-top-2 plasmo:data-[side=left]:slide-in-from-right-2 plasmo:data-[side=right]:slide-in-from-left-2 plasmo:data-[side=top]:slide-in-from-bottom-2 plasmo:z-50 plasmo:min-w-[8rem] plasmo:origin-(--radix-dropdown-menu-content-transform-origin) plasmo:overflow-hidden plasmo:rounded-md plasmo:border plasmo:p-1 plasmo:shadow-lg",
                className
            )}
            {...props}
        />
    );
}

export {
    DropdownMenu,
    DropdownMenuPortal,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuLabel,
    DropdownMenuItem,
    DropdownMenuCheckboxItem,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
};
