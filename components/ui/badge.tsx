import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

const badgeVariants = cva(
    "plasmo:inline-flex plasmo:items-center plasmo:justify-center plasmo:rounded-full plasmo:border plasmo:font-medium plasmo:w-fit plasmo:whitespace-nowrap plasmo:shrink-0 plasmo:[&>svg]:pointer-events-none plasmo:focus-visible:border-ring plasmo:focus-visible:ring-ring/50 plasmo:focus-visible:ring-[3px] plasmo:aria-invalid:ring-destructive/20 plasmo:dark:aria-invalid:ring-destructive/40 plasmo:aria-invalid:border-destructive plasmo:transition-[color,box-shadow] plasmo:overflow-hidden",
    {
        variants: {
            variant: {
                default:
                    "plasmo:border-transparent plasmo:bg-primary plasmo:text-primary-foreground! plasmo:[a&]:hover:bg-primary/90",
                secondary:
                    "plasmo:border-transparent plasmo:bg-secondary plasmo:text-secondary-foreground! plasmo:[a&]:hover:bg-secondary/90",
                destructive:
                    "plasmo:border-transparent plasmo:bg-destructive plasmo:text-white! plasmo:[a&]:hover:bg-destructive/90 plasmo:focus-visible:ring-destructive/20 plasmo:dark:focus-visible:ring-destructive/40 plasmo:dark:bg-destructive/60",
                outline:
                    "plasmo:text-foreground! plasmo:[a&]:hover:bg-accent plasmo:[a&]:hover:text-accent-foreground!",
            },
            size: {
                default:
                    "plasmo:px-2 plasmo:py-0.5 plasmo:text-xs plasmo:gap-1 plasmo:[&>svg]:size-3",
                sm: "plasmo:px-1.5 plasmo:py-0 plasmo:text-xs plasmo:gap-0.5 plasmo:[&>svg]:size-2.5",
                md: "plasmo:px-2 plasmo:py-0 plasmo:text-base plasmo:gap-0.5 plasmo:[&>svg]:size-2.5",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
);

function Badge({
    className,
    variant,
    size,
    asChild = false,
    ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
    const Comp = asChild ? Slot : "span";

    return (
        <Comp
            data-slot="badge"
            className={cn(badgeVariants({ variant, size }), className)}
            {...props}
        />
    );
}

export { Badge, badgeVariants };
