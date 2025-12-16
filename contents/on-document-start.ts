import type { PlasmoCSConfig } from "plasmo";

import { Storage } from "@plasmohq/storage";

export const config: PlasmoCSConfig = {
    matches: ["*://*.netsuite.com/*"],
    run_at: "document_start",
};

const storage = new Storage();

const hideGuidedLearning = async () => {
    try {
        const isHideGuidedLearning = await storage.get("feature_hide_guided_learning");

        if (isHideGuidedLearning) {
            const style = document.createElement("style");
            style.id = "netsuite-hide-guided-learning";
            style.textContent = ".ogl-rw-convergence-launcher { display: none !important; }";
            document.head.appendChild(style);
        }
    } catch (e) {
        console.error(e);
    }
};

const hideHeaderBackground = async () => {
    try {
        const isHideHeaderBackground = await storage.get("feature_hide_header_background");

        if (isHideHeaderBackground) {
            const style = document.createElement("style");
            style.id = "netsuite-hide-header-background";
            style.textContent = `
            [data-widget="NetsuiteSystemHeader"] {
                background-image: none !important;
                padding-top: 0 !important;
            }
            body[data-header="redwood"] #div__header {
                height: 96px !important;
            }
        `;
            document.head.appendChild(style);
        }
    } catch (e) {
        console.error(e);
    }
};

const onDocumentStart = async () => {
    hideGuidedLearning();
    hideHeaderBackground();
};

void onDocumentStart();
