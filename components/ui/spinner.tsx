import { cn } from "@/lib/utils";
import { Loader2Icon, type LucideProps } from "lucide-react";

function Spinner({ className, ...props }: LucideProps) {
    return (
        <Loader2Icon
            role="status"
            aria-label="Loading"
            className={cn("plasmo:size-4 plasmo:animate-spin", className)}
            {...props}
        />
    );
}

export { Spinner };
