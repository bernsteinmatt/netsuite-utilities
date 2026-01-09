import type { PlasmoCSConfig } from "plasmo";

import { requireNetSuiteModule } from "~lib/utils/require-netsuite-module";

export const config: PlasmoCSConfig = {
    matches: ["*://*.netsuite.com/*"],
    world: "MAIN",
};

const quickExecuteId = "__quickexecute";

const EXECUTABLE_SCRIPT_TYPES = ["MAPREDUCE", "SCHEDULED"];

const isExecutableScript = async (): Promise<boolean> => {
    try {
        const currentRecord = await requireNetSuiteModule<{ get: () => any }>("currentRecord");
        const record = currentRecord.get();
        const scriptType = record.getValue({ fieldId: "scripttype" });
        return EXECUTABLE_SCRIPT_TYPES.includes(scriptType);
    } catch (e) {
        console.error("Error checking script type:", e);
        return false;
    }
};

const submitMapReduceScript = async (event: Event): Promise<void> => {
    const button = event.target as HTMLButtonElement & HTMLInputElement;
    const labelSpan = button.querySelector(".uir-button-label");

    // Handle both Redwood (span label) and legacy (value) themes
    if (labelSpan) {
        labelSpan.textContent = "Executing...";
    } else {
        button.value = "Executing...";
    }
    button.disabled = true;
    button.style.opacity = ".6";
    // Get the edit mode URL
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set("e", "T");
    currentUrl.searchParams.set("l", "T");

    // Create a temporary iframe to load the edit page
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    // iframe.style = "width:100%; height:400px; border:solid black 1px;";
    iframe.src = currentUrl.href;
    document.querySelector("#div__body").appendChild(iframe);
    // Wait for iframe to load
    await new Promise((resolve) => {
        iframe.addEventListener("load", resolve, { once: true });
    });

    // Call the function in the iframe's context
    const iframeWindow: any = iframe.contentWindow;
    iframeWindow.confirm = function () {
        return true;
    };
    iframe.addEventListener("load", function handler() {
        try {
            const iframeUrl = iframe.contentWindow?.location.href || "";

            // Check if redirected to deployment page (no available deployment)
            if (iframeUrl.includes("scriptrecord.nl")) {
                alert(
                    "No available deployment found for this script. Please create a deployment first."
                );
            }
        } catch (e) {
            console.error("[QuickExecute] Error reading iframe content:", e);
        }

        iframe.remove();
        if (labelSpan) {
            labelSpan.textContent = "Execute";
        } else {
            button.value = "Execute";
        }
        button.disabled = false;
        button.style.opacity = "";
    });

    iframeWindow?.NLMultiButton_doAction("multibutton_submitter", "submitexecute");
    // const pollScriptExecution = async (
    //     scriptInternalId,
    //     intervalMs = 5000,
    //     maxAttempts = 60
    // ) => {
    //     let attempts = 0;
    //
    //     while (attempts < maxAttempts) {
    //         const response = await fetch(
    //             "https://tstdrv2034515.app.netsuite.com/app/common/scripting/nlapijsonhandler.nl",
    //             {
    //                 method: "POST",
    //                 headers: {
    //                     "Content-Type": "application/json",
    //                 },
    //                 body: JSON.stringify({
    //                     method: "remoteObject.searchRecord",
    //                     params: [
    //                         "scheduledscriptinstance",
    //                         null,
    //                         [
    //                             {
    //                                 javaClass: "java.util.HashMap",
    //                                 operator: "anyof",
    //                                 values: [scriptInternalId.toString()],
    //                                 join: "script",
    //                                 name: "internalid",
    //                             },
    //                             {
    //                                 javaClass: "java.util.HashMap",
    //                                 operator: "anyof",
    //                                 values: ["PENDING", "PROCESSING"],
    //                                 name: "status",
    //                             },
    //                         ],
    //                         [
    //                             {
    //                                 join: "scriptDeployment",
    //                                 summary: "GROUP",
    //                                 name: "internalid",
    //                             },
    //                             {
    //                                 summary: "MAX",
    //                                 name: "status",
    //                             },
    //                         ],
    //                     ],
    //                 }),
    //             }
    //         );
    //
    //         const data = await response.json();
    //
    //         if (!data.result?.rows || data.result.rows.length === 0) {
    //             console.log("✅ Script completed (no running instances found)");
    //             return { completed: true };
    //         }
    //
    //         const status = data.result.rows[0].cells.find(
    //             (c) => c.name === "status"
    //         )?.value;
    //         const deploymentId = data.result.rows[0].cells.find(
    //             (c) => c.name === "internalid"
    //         )?.value;
    //
    //         console.log(
    //             `📊 Deployment ${deploymentId}: ${status} (attempt ${attempts + 1}/${maxAttempts})`
    //         );
    //
    //         await new Promise((resolve) => setTimeout(resolve, intervalMs));
    //         attempts++;
    //     }
    //
    //     console.log("⏱️ Polling timed out");
    //     return { completed: false, timeout: true };
    // };
    //
    // // Usage
    // const result = await pollScriptExecution(1307);
};

const addExecuteButton = () => {
    // Check if button already exists
    if (document.querySelector(`#tbl_${quickExecuteId}`)) {
        return true;
    }

    // Find the Back/Cancel button TD (works for both legacy and Redwood themes)
    const existingNetsuiteElement = document.querySelector(
        "td:has(#tbl__cancel),td:has(#tbl__back)"
    );

    if (!existingNetsuiteElement) {
        return false; // Not found yet
    }

    // Clone the entire TD
    const clonedElement = existingNetsuiteElement.cloneNode(true) as HTMLElement;

    // Update IDs in the clone
    clonedElement.innerHTML = clonedElement.innerHTML
        .replace(/__cancel/g, quickExecuteId)
        .replace(/_changeid/g, quickExecuteId)
        .replace(/__back/g, quickExecuteId)
        .replace(/_deployscript/g, quickExecuteId);

    // Handle Redwood theme (uses <button> elements)
    const buttonElement = clonedElement.querySelector("button");
    if (buttonElement) {
        buttonElement.id = quickExecuteId;
        buttonElement.onclick = submitMapReduceScript;
        const labelSpan = buttonElement.querySelector(".uir-button-label");
        if (labelSpan) {
            labelSpan.textContent = "Execute";
        }
    }

    // Handle legacy theme (uses <input> elements)
    const inputElement = clonedElement.querySelector(
        "input[type='button']"
    ) as HTMLInputElement | null;
    if (inputElement) {
        const newInput = document.createElement("input");
        newInput.value = "Execute";
        newInput.id = quickExecuteId;
        newInput.type = inputElement.type;
        newInput.className = inputElement.className;
        newInput.onclick = submitMapReduceScript;

        // Replace the old input with the new one
        inputElement.parentNode?.replaceChild(newInput, inputElement);
    }

    // Insert after Cancel/Back button
    existingNetsuiteElement.parentNode?.insertBefore(
        clonedElement,
        existingNetsuiteElement.nextSibling
    );
    return true; // Successfully added
};

// Check if we're on the correct page
const shouldAddButton = (): boolean => {
    const url = new URL(window.location.href);

    // Check if path matches
    const isScriptPage = url.pathname.includes("/app/common/scripting/script.nl");

    // Check if ID parameter exists
    const hasId = url.searchParams.has("id");

    return isScriptPage && hasId;
};

const init = async () => {
    if (!shouldAddButton()) return;

    const isExecutable = await isExecutableScript();
    if (!isExecutable) return;

    // Try immediately
    if (addExecuteButton()) {
        // Found it right away, done!
    } else {
        // Not found yet, watch for it
        const observer = new MutationObserver(() => {
            if (addExecuteButton()) {
                observer.disconnect();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });
    }
};

init();
