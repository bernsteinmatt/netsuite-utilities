import { cn } from "@/lib/utils";
import { Coffee, Github } from "lucide-react";

interface SupportLinksProps {
    className?: string;
}

export const SupportLinks = ({ className }: SupportLinksProps) => {
    return (
        <div
            className={cn(
                "plasmo:flex plasmo:items-center plasmo:justify-center plasmo:gap-4 plasmo:border-t plasmo:border-border plasmo:py-2 plasmo:px-4",
                className
            )}
        >
            <a
                href="https://github.com/bernsteinmatt/netsuite-utilities"
                target="_blank"
                rel="noopener noreferrer"
                className="plasmo:flex plasmo:items-center plasmo:gap-1.5 plasmo:text-xs plasmo:text-muted-foreground plasmo:hover:text-foreground plasmo:transition-colors"
            >
                <Github className="plasmo:size-4" />
                <span>GitHub</span>
            </a>
            <a
                href="https://buymeacoffee.com/matthewbernstein"
                target="_blank"
                rel="noopener noreferrer"
                className="plasmo:flex plasmo:items-center plasmo:gap-1.5 plasmo:text-xs plasmo:text-muted-foreground plasmo:hover:text-foreground plasmo:transition-colors"
            >
                <Coffee className="plasmo:size-4" />
                <span>Buy Me a Coffee</span>
            </a>
        </div>
    );
};
