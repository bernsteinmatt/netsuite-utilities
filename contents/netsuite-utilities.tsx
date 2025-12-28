import cssText from "data-text:@/style.css";
import type { PlasmoCSConfig, PlasmoGetRootContainer } from "plasmo";
import { useCallback, useState } from "react";

import { NetsuiteUtilities } from "~components/netsuite-utilities/netsuite-utilities";

export const config: PlasmoCSConfig = {
    matches: [
        "*://*.netsuite.com/*",
        // "http://localhost:5173/*",
    ],
};

/**
 * Mount the content script directly to the page's DOM instead of using Shadow DOM.
 * This is necessary because react-resizable-panels is not compatible with Shadow DOM.
 */
export const getRootContainer: PlasmoGetRootContainer = () => {
    const container = document.createElement("div");
    container.id = "netsuite-utilities-root";
    document.body.appendChild(container);

    return container;
};

const ContentScript = () => {
    const [stylesInjected, setStylesInjected] = useState(false);

    const handleStylesNeeded = useCallback((needed: boolean) => {
        const styleId = "netsuite-utilities-styles";

        if (needed && !stylesInjected) {
            if (!document.getElementById(styleId)) {
                const styleElement = document.createElement("style");
                styleElement.id = styleId;
                styleElement.textContent = cssText;
                document.head.appendChild(styleElement);
            }
            setStylesInjected(true);
        } else if (!needed && stylesInjected) {
            const existingStyle = document.getElementById(styleId);
            if (existingStyle) {
                existingStyle.remove();
            }
            setStylesInjected(false);
        }
    }, [stylesInjected]);

    return (
        <NetsuiteUtilities
            mode="content"
            onStylesNeeded={handleStylesNeeded}
        />
    );
};

export default ContentScript;
