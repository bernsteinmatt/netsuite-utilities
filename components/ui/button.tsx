import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

const buttonVariants = cva(
    "plasmo:inline-flex plasmo:items-center plasmo:justify-center plasmo:gap-2 plasmo:whitespace-nowrap plasmo:rounded-md plasmo:text-sm plasmo:font-medium plasmo:transition-all plasmo:disabled:pointer-events-none plasmo:disabled:opacity-50 plasmo:[&_svg]:pointer-events-none plasmo:[&_svg:not([class*=size-])]:size-4 plasmo:shrink-0 plasmo:[&_svg]:shrink-0 plasmo:outline-none plasmo:focus-visible:border-ring plasmo:focus-visible:ring-ring/50 plasmo:focus-visible:ring-[3px] plasmo:aria-invalid:ring-destructive/20 plasmo:dark:aria-invalid:ring-destructive/40 plasmo:aria-invalid:border-destructive",
    {
        variants: {
            variant: {
                default:
                    "plasmo:bg-primary plasmo:text-primary-foreground plasmo:hover:bg-primary/90",
                destructive:
                    "plasmo:bg-destructive plasmo:text-white plasmo:hover:bg-destructive/90 plasmo:focus-visible:ring-destructive/20 plasmo:dark:focus-visible:ring-destructive/40 plasmo:dark:bg-destructive/60",
                outline:
                    "plasmo:border plasmo:bg-background plasmo:shadow-xs plasmo:hover:bg-accent plasmo:hover:text-accent-foreground plasmo:dark:bg-input/30 plasmo:dark:border-input plasmo:dark:hover:bg-input/50",
                secondary:
                    "plasmo:bg-secondary plasmo:text-secondary-foreground plasmo:hover:bg-secondary/80",
                ghost: "plasmo:hover:bg-accent plasmo:hover:text-accent-foreground plasmo:dark:hover:bg-accent/50",
                link: "plasmo:text-primary plasmo:underline-offset-4 plasmo:hover:underline",
            },
            size: {
                default: "plasmo:h-9 plasmo:px-4 plasmo:py-2 plasmo:has-[>svg]:px-3",
                sm: "plasmo:h-8 plasmo:rounded-md plasmo:gap-1.5 plasmo:px-3 plasmo:has-[>svg]:px-2.5",
                lg: "plasmo:h-10 plasmo:rounded-md plasmo:px-6 plasmo:has-[>svg]:px-4",
                icon: "plasmo:size-9",
                "icon-sm": "plasmo:size-8",
                "icon-lg": "plasmo:size-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
);

function Button({
    className,
    variant,
    size,
    asChild = false,
    ...props
}: React.ComponentProps<"button"> &
    VariantProps<typeof buttonVariants> & {
        asChild?: boolean;
    }) {
    const Comp = asChild ? Slot : "button";

    return (
        <Comp
            data-slot="button"
            className={cn(buttonVariants({ variant, size, className }))}
            {...props}
        />
    );
}

export { Button, buttonVariants };
