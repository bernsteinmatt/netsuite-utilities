import type { PlasmoCSConfig } from "plasmo";

export const config: PlasmoCSConfig = {
    matches: ["*://*.netsuite.com/*"],
    world: "MAIN",
};

const quickExecuteId = "__quickexecute";

const addExecuteButton = () => {
    // Find the Cancel button TD
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

    // Find and replace the input element
    const inputElement = clonedElement.querySelector("input");
    if (inputElement) {
        const newInput = document.createElement("input");
        newInput.value = "Execute";
        newInput.id = quickExecuteId;
        newInput.type = inputElement.type;
        newInput.className = inputElement.className;
        newInput.onclick = async () => {
            const button = event.target as HTMLButtonElement;
            button.value = "Executing...";
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
                // console.log("Iframe navigated to:", iframe.contentWindow.location.href);
                iframe.remove();
                button.value = "Execute";
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

        // Replace the old input with the new one
        inputElement.parentNode?.replaceChild(newInput, inputElement);
    }

    // Insert after Cancel button
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

if (shouldAddButton()) {
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
}
