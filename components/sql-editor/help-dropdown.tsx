import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { isNetSuite } from "@/lib/is-netsuite";
import { clearSchema, fetchNetSuiteSchema, loadSchema, saveSchema } from "@/lib/netsuite-schema";
import { ExternalLink, HelpCircle, Keyboard, Loader2 } from "lucide-react";
import { useState } from "react";

const isMac =
    typeof navigator !== "undefined" && navigator.userAgent.toUpperCase().indexOf("MAC") >= 0;
const modKey = isMac ? "⌘" : "Ctrl";

const KEYBOARD_SHORTCUTS = [
    { keys: [`${modKey}`, "Shift", "Enter"], description: "Run Query" },
    { keys: [`${modKey}`, "Shift", "F"], description: "Format SQL" },
    { keys: ["Esc"], description: "Close Editor" },
];

const getAccountId = (): string | null => {
    const match = window.location.hostname.match(/^([a-z0-9_-]+)\.app\.netsuite\.com$/i);
    return match ? match[1] : null;
};

const HELP_LINKS = [
    {
        id: "records-catalog",
        label: "Records Catalog",
        getUrl: () => {
            const accountId = getAccountId();
            return accountId
                ? `https://${accountId}.app.netsuite.com/app/recordscatalog/rcbrowser.nl`
                : null;
        },
    },
    {
        id: "builtin-functions",
        label: "Built-In Functions",
        getUrl: () =>
            "https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/article_161950565221.html",
    },
];

export const HelpDropdown = () => {
    const [isFetchingSchema, setIsFetchingSchema] = useState(false);
    const [schemaProgress, setSchemaProgress] = useState<string>("");
    const [showShortcuts, setShowShortcuts] = useState(false);

    const handleLinkClick = (getUrl: () => string | null) => {
        const url = getUrl();
        if (url) {
            window.open(url, "_blank", "noopener,noreferrer");
        }
    };

    const handleCacheSchema = async () => {
        if (isFetchingSchema) return;

        setIsFetchingSchema(true);
        setSchemaProgress("Starting...");

        try {
            const schema = await fetchNetSuiteSchema((current, total) => {
                setSchemaProgress(`${current}/${total}`);
            });

            saveSchema(schema);
            console.log("[Schema] Cached schema:", schema);
            setSchemaProgress(`Done! ${Object.keys(schema).length} tables`);

            // Reset progress after a delay
            setTimeout(() => {
                setSchemaProgress("");
            }, 2000);
        } catch (err) {
            console.error("[Schema] Failed to fetch schema:", err);
            setSchemaProgress("Error!");
        } finally {
            setIsFetchingSchema(false);
        }
    };

    const cachedSchema = loadSchema();
    const hasCachedSchema = cachedSchema !== null;
    const cachedTableCount = hasCachedSchema ? Object.keys(cachedSchema).length : 0;

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger className="plasmo:inline-flex plasmo:items-center plasmo:justify-center plasmo:rounded-md plasmo:size-9 plasmo:cursor-pointer plasmo:hover:bg-accent plasmo:hover:text-accent-foreground">
                    <HelpCircle className="plasmo:size-5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="plasmo:z-1002 plasmo:py-1!">
                    {HELP_LINKS.map((item) => {
                        const url = item.getUrl();
                        const isDisabled = !url;

                        return (
                            <DropdownMenuItem
                                key={item.id}
                                className="plasmo:px-4! plasmo:py-2! plasmo:flex plasmo:items-center plasmo:gap-2"
                                disabled={isDisabled}
                                onSelect={() => handleLinkClick(item.getUrl)}
                            >
                                {item.label}
                                <ExternalLink className="plasmo:size-3 plasmo:text-muted-foreground" />
                            </DropdownMenuItem>
                        );
                    })}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        className="plasmo:px-4! plasmo:py-2! plasmo:flex plasmo:items-center plasmo:gap-2"
                        disabled={!isNetSuite() || isFetchingSchema}
                        onSelect={(e) => {
                            e.preventDefault();
                            handleCacheSchema();
                        }}
                    >
                        {isFetchingSchema ? (
                            <Loader2 className="plasmo:size-4 plasmo:animate-spin" />
                        ) : null}
                        <span>
                            {isFetchingSchema
                                ? `Caching Schema... ${schemaProgress}`
                                : hasCachedSchema
                                  ? `Refresh Schema (${cachedTableCount} tables)`
                                  : "Cache Schema"}
                        </span>
                    </DropdownMenuItem>
                    {hasCachedSchema && (
                        <DropdownMenuItem
                            className="plasmo:px-4! plasmo:py-2! plasmo:flex plasmo:items-center plasmo:gap-2 plasmo:text-destructive"
                            disabled={isFetchingSchema}
                            onSelect={() => {
                                clearSchema();
                                window.location.reload();
                            }}
                        >
                            Clear Schema Cache
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        className="plasmo:px-4! plasmo:py-2! plasmo:flex plasmo:items-center plasmo:gap-2"
                        onSelect={() => setShowShortcuts(true)}
                    >
                        <Keyboard className="plasmo:size-4" />
                        Keyboard Shortcuts
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={showShortcuts} onOpenChange={setShowShortcuts}>
                <DialogContent className="plasmo:sm:max-w-md plasmo:z-1002 plasmo:text-foreground">
                    <DialogHeader>
                        <DialogTitle>Keyboard Shortcuts</DialogTitle>
                    </DialogHeader>
                    <div className="plasmo:space-y-3">
                        {KEYBOARD_SHORTCUTS.map((shortcut, index) => (
                            <div
                                key={index}
                                className="plasmo:flex plasmo:items-center plasmo:justify-between"
                            >
                                <span className="plasmo:text-base plasmo:text-foreground">
                                    {shortcut.description}
                                </span>
                                <KbdGroup>
                                    {shortcut.keys.map((key, keyIndex) => (
                                        <Kbd key={keyIndex}>{key}</Kbd>
                                    ))}
                                </KbdGroup>
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};
