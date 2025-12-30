import { cn } from "@/lib/utils";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { XIcon } from "lucide-react";
import * as React from "react";

function Dialog({ ...props }: React.ComponentProps<typeof DialogPrimitive.Root>) {
    return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({ ...props }: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
    return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({ ...props }: React.ComponentProps<typeof DialogPrimitive.Portal>) {
    return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({ ...props }: React.ComponentProps<typeof DialogPrimitive.Close>) {
    return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({
    className,
    ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
    return (
        <DialogPrimitive.Overlay
            data-slot="dialog-overlay"
            className={cn(
                "plasmo:data-[state=open]:animate-in plasmo:data-[state=closed]:animate-out plasmo:data-[state=closed]:fade-out-0 plasmo:data-[state=open]:fade-in-0 plasmo:fixed plasmo:inset-0 plasmo:z-50 plasmo:bg-black/50",
                className
            )}
            {...props}
        />
    );
}

function DialogContent({
    className,
    children,
    showCloseButton = true,
    ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
    showCloseButton?: boolean;
}) {
    return (
        <DialogPortal data-slot="dialog-portal">
            <DialogOverlay className={"plasmo:z-1000"}/>
            <DialogPrimitive.Content
                data-slot="dialog-content"
                className={cn(
                    "plasmo:bg-background plasmo:data-[state=open]:animate-in plasmo:data-[state=closed]:animate-out plasmo:data-[state=closed]:fade-out-0 plasmo:data-[state=open]:fade-in-0 plasmo:data-[state=closed]:zoom-out-95 plasmo:data-[state=open]:zoom-in-95 plasmo:fixed plasmo:top-[50%] plasmo:left-[50%] plasmo:z-50 plasmo:grid plasmo:w-full plasmo:max-w-[calc(100%-2rem)] plasmo:translate-x-[-50%] plasmo:translate-y-[-50%] plasmo:gap-4 plasmo:rounded-lg plasmo:border plasmo:p-6 plasmo:shadow-lg plasmo:duration-200 plasmo:sm:max-w-lg",
                    className
                )}
                {...props}
            >
                {children}
                {showCloseButton && (
                    <DialogPrimitive.Close
                        data-slot="dialog-close"
                        className="plasmo:ring-offset-background plasmo:focus:ring-ring plasmo:data-[state=open]:bg-accent plasmo:data-[state=open]:text-muted-foreground plasmo:absolute plasmo:top-4 plasmo:right-4 plasmo:rounded-xs plasmo:opacity-70 plasmo:transition-opacity plasmo:hover:opacity-100 plasmo:focus:ring-2 plasmo:focus:ring-offset-2 plasmo:focus:outline-hidden plasmo:disabled:pointer-events-none plasmo:[&_svg]:pointer-events-none plasmo:[&_svg]:shrink-0 plasmo:[&_svg:not([class*=size-])]:size-4"
                    >
                        <XIcon />
                        <span className="plasmo:sr-only">Close</span>
                    </DialogPrimitive.Close>
                )}
            </DialogPrimitive.Content>
        </DialogPortal>
    );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="dialog-header"
            className={cn(
                "plasmo:flex plasmo:flex-col plasmo:gap-2 plasmo:text-center plasmo:sm:text-left",
                className
            )}
            {...props}
        />
    );
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="dialog-footer"
            className={cn(
                "plasmo:flex plasmo:flex-col-reverse plasmo:gap-2 plasmo:sm:flex-row plasmo:sm:justify-end",
                className
            )}
            {...props}
        />
    );
}

function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
    return (
        <DialogPrimitive.Title
            data-slot="dialog-title"
            className={cn("plasmo:text-lg plasmo:leading-none plasmo:font-semibold", className)}
            {...props}
        />
    );
}

function DialogDescription({
    className,
    ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
    return (
        <DialogPrimitive.Description
            data-slot="dialog-description"
            className={cn("plasmo:text-muted-foreground plasmo:text-sm", className)}
            {...props}
        />
    );
}

export {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogOverlay,
    DialogPortal,
    DialogTitle,
    DialogTrigger,
};
