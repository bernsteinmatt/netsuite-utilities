import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";





const sidebars: SidebarsConfig = {
    docsSidebar: [
        "intro",
        {
            type: "category",
            label: "Getting Started",
            items: ["getting-started/installation", "getting-started/quick-start"],
        },
        {
            type: "category",
            label: "Features",
            items: [
                "features/command-search",
                "features/suiteql-editor",
                "features/script-log-viewer",
                "features/record-detail",
                "features/side-panel",
                "features/ui-enhancements",
                "features/module-loader",
            ],
        },
        {
            type: "category",
            label: "Reference",
            items: ["reference/keyboard-shortcuts"],
        },
        "contributing",
    ],
};

export default sidebars;
