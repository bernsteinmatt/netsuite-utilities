// React Data Grid Component
import { Spinner } from "@/components/ui/spinner";
import { AllCommunityModule, ModuleRegistry, themeQuartz } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useMemo } from "react";

// Register all Community features
ModuleRegistry.registerModules([AllCommunityModule]);

// const myTheme = themeQuartz.withPart(colorSchemeDark);
const myTheme = themeQuartz.withParams({
    backgroundColor: "var(--plasmo-color-background)",
    foregroundColor: "var(--plasmo-color-foreground)",
    headerTextColor: "var(--plasmo-color-foreground)",
    // headerBackgroundColor: "rgb(209, 64, 129)",
    headerBackgroundColor: "color-mix(in oklab,var(--plasmo-color-background)60%,transparent)",
    // headerBackgroundColor: "var(--color-base-200)",
    // oddRowBackgroundColor: "color-mix(in oklab,var(--color-base-200)75%,transparent)",
    headerColumnResizeHandleColor: "var(--plasmo-color-foreground)",
    //     color-mix(in oklab,var(--color-sky-500)75%,transparent)
});

const LoadingOverlayComponent = () => {
    return <Spinner className={"plasmo:size-20"} />;
};

const getColumns = (data, excludeFields = []) => {
    if (!Array.isArray(data) || data.length === 0) {
        return [];
    }

    const firstItem = data[0];

    return Object.keys(firstItem)
        .filter((key) => !excludeFields.includes(key))
        .map((key) => ({ field: key }));
};

const excludeFields = ["rownumber"];
export const DataGrid = ({ height, defaultColDef = {}, data, loading, ...rest }) => {
    const colDefs = useMemo(() => {
        return getColumns(data, excludeFields);
    }, [data]);

    return (
        // Data Grid will fill the size of the parent container
        <div style={{ height: height }}>
            <AgGridReact
                rowData={loading ? null : data}
                columnDefs={colDefs}
                defaultColDef={defaultColDef}
                theme={myTheme}
                loadingOverlayComponent={LoadingOverlayComponent}
                loading={loading}
                enableCellTextSelection={true}
                ensureDomOrder={true}
                {...rest}
            />
        </div>
    );
};
