import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { useMemo } from "react";

function FieldSet({ className, ...props }: React.ComponentProps<"fieldset">) {
    return (
        <fieldset
            data-slot="field-set"
            className={cn(
                "plasmo:flex plasmo:flex-col plasmo:gap-6",
                "plasmo:has-[>[data-slot=checkbox-group]]:gap-3 plasmo:has-[>[data-slot=radio-group]]:gap-3",
                className
            )}
            {...props}
        />
    );
}

function FieldLegend({
    className,
    variant = "legend",
    ...props
}: React.ComponentProps<"legend"> & { variant?: "legend" | "label" }) {
    return (
        <legend
            data-slot="field-legend"
            data-variant={variant}
            className={cn(
                "plasmo:mb-3 plasmo:font-medium",
                "plasmo:data-[variant=legend]:text-base",
                "plasmo:data-[variant=label]:text-sm",
                className
            )}
            {...props}
        />
    );
}

function FieldGroup({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="field-group"
            className={cn(
                "plasmo:group/field-group plasmo:@container/field-group plasmo:flex plasmo:w-full plasmo:flex-col plasmo:gap-7 plasmo:data-[slot=checkbox-group]:gap-3 plasmo:[&>[data-slot=field-group]]:gap-4",
                className
            )}
            {...props}
        />
    );
}

const fieldVariants = cva(
    "plasmo:group/field plasmo:flex plasmo:w-full plasmo:gap-3 plasmo:data-[invalid=true]:text-destructive",
    {
        variants: {
            orientation: {
                vertical: ["plasmo:flex-col plasmo:[&>*]:w-full plasmo:[&>.sr-only]:w-auto"],
                horizontal: [
                    "plasmo:flex-row plasmo:items-center",
                    "plasmo:[&>[data-slot=field-label]]:flex-auto",
                    "plasmo:has-[>[data-slot=field-content]]:items-start plasmo:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
                ],
                responsive: [
                    "plasmo:flex-col plasmo:[&>*]:w-full plasmo:[&>.sr-only]:w-auto plasmo:@md/field-group:flex-row plasmo:@md/field-group:items-center plasmo:@md/field-group:[&>*]:w-auto",
                    "plasmo:@md/field-group:[&>[data-slot=field-label]]:flex-auto",
                    "plasmo:@md/field-group:has-[>[data-slot=field-content]]:items-start plasmo:@md/field-group:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
                ],
            },
        },
        defaultVariants: {
            orientation: "vertical",
        },
    }
);

function Field({
    className,
    orientation = "vertical",
    ...props
}: React.ComponentProps<"div"> & VariantProps<typeof fieldVariants>) {
    return (
        <div
            role="group"
            data-slot="field"
            data-orientation={orientation}
            className={cn(fieldVariants({ orientation }), className)}
            {...props}
        />
    );
}

function FieldContent({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="field-content"
            className={cn(
                "plasmo:group/field-content plasmo:flex plasmo:flex-1 plasmo:flex-col plasmo:gap-1.5 plasmo:leading-snug",
                className
            )}
            {...props}
        />
    );
}

function FieldLabel({ className, ...props }: React.ComponentProps<typeof Label>) {
    return (
        <Label
            data-slot="field-label"
            className={cn(
                "plasmo:group/field-label plasmo:peer/field-label plasmo:flex plasmo:w-fit plasmo:gap-2 plasmo:leading-snug plasmo:group-data-[disabled=true]/field:opacity-50",
                "plasmo:has-[>[data-slot=field]]:w-full plasmo:has-[>[data-slot=field]]:flex-col plasmo:has-[>[data-slot=field]]:rounded-md plasmo:has-[>[data-slot=field]]:border plasmo:[&>*]:data-[slot=field]:p-4",
                "plasmo:has-data-[state=checked]:bg-primary/5 plasmo:has-data-[state=checked]:border-primary plasmo:dark:has-data-[state=checked]:bg-primary/10",
                className
            )}
            {...props}
        />
    );
}

function FieldTitle({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="field-label"
            className={cn(
                "plasmo:flex plasmo:w-fit plasmo:items-center plasmo:gap-2 plasmo:text-sm plasmo:leading-snug plasmo:font-medium plasmo:group-data-[disabled=true]/field:opacity-50",
                className
            )}
            {...props}
        />
    );
}

function FieldDescription({ className, ...props }: React.ComponentProps<"p">) {
    return (
        <p
            data-slot="field-description"
            className={cn(
                "plasmo:text-muted-foreground plasmo:text-sm plasmo:leading-normal plasmo:font-normal plasmo:group-has-[[data-orientation=horizontal]]/field:text-balance",
                "plasmo:last:mt-0 plasmo:nth-last-2:-mt-1 plasmo:[[data-variant=legend]+&]:-mt-1.5",
                "plasmo:[&>a:hover]:text-primary plasmo:[&>a]:underline plasmo:[&>a]:underline-offset-4",
                className
            )}
            {...props}
        />
    );
}

function FieldSeparator({
    children,
    className,
    ...props
}: React.ComponentProps<"div"> & {
    children?: React.ReactNode;
}) {
    return (
        <div
            data-slot="field-separator"
            data-content={!!children}
            className={cn(
                "plasmo:relative plasmo:-my-2 plasmo:h-5 plasmo:text-sm plasmo:group-data-[variant=outline]/field-group:-mb-2",
                className
            )}
            {...props}
        >
            <Separator className="plasmo:absolute plasmo:inset-0 plasmo:top-1/2" />
            {children && (
                <span
                    className="plasmo:bg-background plasmo:text-muted-foreground plasmo:relative plasmo:mx-auto plasmo:block plasmo:w-fit plasmo:px-2"
                    data-slot="field-separator-content"
                >
                    {children}
                </span>
            )}
        </div>
    );
}

function FieldError({
    className,
    children,
    errors,
    ...props
}: React.ComponentProps<"div"> & {
    errors?: Array<{ message?: string } | undefined>;
}) {
    const content = useMemo(() => {
        if (children) {
            return children;
        }

        if (!errors?.length) {
            return null;
        }

        const uniqueErrors = [...new Map(errors.map((error) => [error?.message, error])).values()];

        if (uniqueErrors?.length == 1) {
            return uniqueErrors[0]?.message;
        }

        return (
            <ul className="plasmo:ml-4 plasmo:flex plasmo:list-disc plasmo:flex-col plasmo:gap-1">
                {uniqueErrors.map(
                    (error, index) => error?.message && <li key={index}>{error.message}</li>
                )}
            </ul>
        );
    }, [children, errors]);

    if (!content) {
        return null;
    }

    return (
        <div
            role="alert"
            data-slot="field-error"
            className={cn("plasmo:text-destructive plasmo:text-sm plasmo:font-normal", className)}
            {...props}
        >
            {content}
        </div>
    );
}

export {
    Field,
    FieldLabel,
    FieldDescription,
    FieldError,
    FieldGroup,
    FieldLegend,
    FieldSeparator,
    FieldSet,
    FieldContent,
    FieldTitle,
};
