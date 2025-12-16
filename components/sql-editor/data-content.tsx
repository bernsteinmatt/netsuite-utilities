import { DataGrid } from "@/components/data-grid";
import { Spinner } from "@/components/ui/spinner";
import { convertToCsv, copyDataToClipboard } from "@/lib/utils";
import clsx from "clsx";
import { Check, Copy } from "lucide-react";
import { useState } from "react";

const Button = ({ children, ...props }) => {
    return <button {...props}>{children}</button>;
};

const CopyButton = ({ value, className = undefined, ...props }) => {
    const [copied, setCopied] = useState(false);

    const copy = () => {
        void copyDataToClipboard({ data: value, setCopied });
    };
    return (
        <Button
            size="sm"
            variant="ghost"
            className={clsx(
                "plasmo:absolute plasmo:top-4 plasmo:right-6 plasmo:hover:brightness-150",
                className
            )}
            onClick={copy}
            {...props}
        >
            {copied ? (
                <Check className="plasmo:size-4 plasmo:text-green-500" />
            ) : (
                <Copy className="plasmo:size-4" />
            )}
        </Button>
    );
};

export const DataContent = ({ data, dataFormat, loading, bottomPanelRef, bottomPanelSize }) => {
    if (!data && !loading) return null;

    if (dataFormat === "table") {
        // eslint-disable-next-line react-hooks/refs
        const height = bottomPanelRef?.current?.offsetHeight
            ? // eslint-disable-next-line react-hooks/refs
              bottomPanelRef.current.offsetHeight - 4
            : bottomPanelSize;
        return (
            <DataGrid
                height={`${height}px`}
                defaultColDef={{
                    resizable: true,
                }}
                loading={loading}
                autoSizeStrategy={{
                    type: "fitGridWidth",
                    defaultMinWidth: 150,
                }}
                data={data}
            />
        );
    }

    if (loading) {
        return (
            <div className={"plasmo:h-full plasmo:flex plasmo:items-center plasmo:justify-center"}>
                <Spinner className={"plasmo:size-20"} />
            </div>
        );
    }

    if (["json", "csv"].includes(dataFormat) && !data?.length) {
        return null;
    }

    const dataRender =
        dataFormat === "json" ? JSON.stringify(data.slice(0, 500), null, 2) : convertToCsv(data);

    return (
        <div className="plasmo:relative plasmo:bg-content/70">
            <div className="plasmo:sticky plasmo:top-0 plasmo:z-10 plasmo:flex plasmo:justify-end">
                <CopyButton
                    value={
                        dataFormat === "json"
                            ? JSON.stringify(data.slice(0, 5000), null, 2)
                            : convertToCsv(data)
                    }
                />
            </div>
            <div className="plasmo:overflow-auto plasmo:p-4!">
                <pre className="plasmo:text-sm">{dataRender}</pre>
            </div>
        </div>
    );
};
