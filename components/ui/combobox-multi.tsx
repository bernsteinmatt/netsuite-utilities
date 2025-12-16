"use client";

import { Badge } from "@/components/ui/badge";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Check, ChevronDown, X } from "lucide-react";
import * as React from "react";

export interface ComboboxOption {
    value: string;
    label: string;
}

interface ComboboxMultiProps {
    options: ComboboxOption[];
    value: string[];
    onChange: (value: string[]) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyText?: string;
    className?: string;
    badgeLimit?: number;
    selectAllLimit?: number;
}

export function ComboboxMulti({
    options,
    value,
    onChange,
    placeholder = "Select items...",
    searchPlaceholder = "Search...",
    emptyText = "No results found.",
    className,
    badgeLimit = 2,
    selectAllLimit = 200,
}: ComboboxMultiProps) {
    const [open, setOpen] = React.useState(false);
    const [search, setSearch] = React.useState("");
    const triggerRef = React.useRef<HTMLDivElement>(null);
    const [triggerWidth, setTriggerWidth] = React.useState<number | undefined>(undefined);

    React.useEffect(() => {
        if (open && triggerRef.current) {
            setTriggerWidth(triggerRef.current.offsetWidth);
        }
    }, [open]);

    // Reset search when popover closes
    React.useEffect(() => {
        if (!open) {
            setSearch("");
        }
    }, [open]);

    const toggleSelection = (optionValue: string) => {
        if (value.includes(optionValue)) {
            onChange(value.filter((v) => v !== optionValue));
        } else {
            onChange([...value, optionValue]);
        }
    };

    const clearAll = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        onChange([]);
    };

    const removeItem = (e: React.MouseEvent, itemValue: string) => {
        e.stopPropagation();
        onChange(value.filter((v) => v !== itemValue));
    };

    const selectedOptions = options.filter((opt) => value.includes(opt.value));

    // Filter options based on search
    const filteredOptions = React.useMemo(() => {
        if (!search) return options;
        const searchLower = search.toLowerCase();
        return options.filter((opt) => opt.label.toLowerCase().includes(searchLower));
    }, [options, search]);

    // Determine if we should show select all buttons
    const showSelectButtons =
        filteredOptions.length > 0 && filteredOptions.length <= selectAllLimit;

    const selectFiltered = () => {
        const filteredValues = filteredOptions.map((opt) => opt.value);
        // Merge with existing selections (avoid duplicates)
        const newValues = [...new Set([...value, ...filteredValues])];
        onChange(newValues);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger className="plasmo:w-full">
                <div
                    ref={triggerRef}
                    role="combobox"
                    aria-expanded={open}
                    tabIndex={0}
                    className={cn(
                        "plasmo:flex plasmo:items-center plasmo:justify-between plasmo:gap-2 plasmo:whitespace-nowrap plasmo:rounded-md plasmo:text-sm plasmo:font-normal",
                        "plasmo:border plasmo:border-input plasmo:bg-transparent plasmo:dark:bg-input/30",
                        "plasmo:h-9 plasmo:px-3! plasmo:py-1!",
                        "plasmo:w-full plasmo:cursor-pointer",
                        "plasmo:shadow-xs plasmo:transition-[color,box-shadow] plasmo:outline-none",
                        "plasmo:focus-visible:border-ring plasmo:focus-visible:ring-ring/50 plasmo:focus-visible:ring-[3px]",
                        !value.length && "plasmo:text-muted-foreground",
                        className
                    )}
                >
                    <span className="plasmo:flex plasmo:items-center plasmo:gap-1 plasmo:flex-1 plasmo:truncate plasmo:text-left">
                        {value.length === 0 ? (
                            placeholder
                        ) : value.length <= badgeLimit ? (
                            <span className="plasmo:flex plasmo:items-center plasmo:gap-1 plasmo:flex-wrap">
                                {selectedOptions.map((opt) => (
                                    <Badge
                                        key={opt.value}
                                        variant="secondary"
                                        size="sm"
                                        className="plasmo:gap-0.5 plasmo:pr-0.5"
                                    >
                                        {opt.label}
                                        <span
                                            role="button"
                                            tabIndex={0}
                                            onClick={(e) => removeItem(e, opt.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" || e.key === " ") {
                                                    e.preventDefault();
                                                    removeItem(e as any, opt.value);
                                                }
                                            }}
                                            className="plasmo:ml-0.5 plasmo:rounded-sm plasmo:hover:bg-muted plasmo:p-0.5! plasmo:cursor-pointer"
                                        >
                                            <X className="plasmo:size-3" />
                                        </span>
                                    </Badge>
                                ))}
                            </span>
                        ) : (
                            <span className="plasmo:flex plasmo:items-center plasmo:gap-1.5">
                                <Badge variant="secondary" size="sm">
                                    {value.length}
                                </Badge>
                                selected
                            </span>
                        )}
                    </span>
                    <span className="plasmo:flex plasmo:items-center plasmo:gap-1 plasmo:shrink-0">
                        {value.length > 0 && (
                            <span
                                role="button"
                                tabIndex={0}
                                onClick={clearAll}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        clearAll();
                                    }
                                }}
                                className="plasmo:rounded-sm plasmo:hover:bg-muted plasmo:p-0.5! plasmo:cursor-pointer"
                            >
                                <X className="plasmo:size-4 plasmo:text-muted-foreground" />
                            </span>
                        )}
                        <ChevronDown className="plasmo:size-4 plasmo:text-muted-foreground" />
                    </span>
                </div>
            </PopoverTrigger>
            <PopoverContent
                className="plasmo:p-0! plasmo:z-1002"
                style={{ width: triggerWidth ? `${triggerWidth}px` : "auto" }}
                align="start"
            >
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder={searchPlaceholder}
                        value={search}
                        onValueChange={setSearch}
                    />
                    {showSelectButtons && (
                        <div className="plasmo:flex plasmo:border-b plasmo:divide-x">
                            <button
                                type="button"
                                className={cn(
                                    "plasmo:flex-1 plasmo:px-3! plasmo:py-2! plasmo:text-sm plasmo:font-medium",
                                    "plasmo:hover:bg-accent plasmo:transition-colors",
                                    "plasmo:disabled:opacity-50 plasmo:disabled:cursor-not-allowed"
                                )}
                                onClick={selectFiltered}
                                disabled={filteredOptions.every((opt) => value.includes(opt.value))}
                            >
                                {search ? "Select Filtered" : "Select All"}
                            </button>
                            <button
                                type="button"
                                className={cn(
                                    "plasmo:flex-1 plasmo:px-3! plasmo:py-2! plasmo:text-sm plasmo:font-medium",
                                    "plasmo:hover:bg-accent plasmo:transition-colors",
                                    "plasmo:disabled:opacity-50 plasmo:disabled:cursor-not-allowed"
                                )}
                                onClick={() => clearAll()}
                                disabled={value.length === 0}
                            >
                                Clear
                            </button>
                        </div>
                    )}
                    <CommandList>
                        <CommandEmpty>{emptyText}</CommandEmpty>
                        <CommandGroup>
                            {filteredOptions.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    value={option.label}
                                    onSelect={() => toggleSelection(option.value)}
                                    className="plasmo:cursor-pointer"
                                >
                                    <span className="plasmo:truncate plasmo:flex-1">
                                        {option.label}
                                    </span>
                                    {value.includes(option.value) && (
                                        <Check className="plasmo:size-4 plasmo:shrink-0 plasmo:text-primary" />
                                    )}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
