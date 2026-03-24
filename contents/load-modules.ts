import type { PlasmoCSConfig } from "plasmo";

export const config: PlasmoCSConfig = {
    matches: ["*://*.netsuite.com/*"],
    world: "MAIN",
};

// Load just the current record and assign to window.currentRec
window.addEventListener("message", (event) => {
    if (event.source !== window || event.data?.type !== "LOAD_CURRENT_RECORD") {
        return;
    }

    try {
        if (typeof (window as any).require === "function") {
            (window as any).require(["N/currentRecord"], function (currentRecordModule: any) {
                const record = currentRecordModule.get();
                if (!record || !record.id) {
                    console.warn("NetSuite Utilities: No current record found on this page.");
                    return;
                }
                (window as any).currentRec = record;
                console.log(
                    `NetSuite Utilities: Current record loaded — ${record.type} (ID: ${record.id})`
                );
                console.log("NetSuite Utilities: Available as window.currentRec");
            });
        } else {
            const m = "NetSuite require function not found. Are you on a NetSuite page?";
            console.error(m);
            alert(m);
        }
    } catch (e) {
        console.error("Error loading current record: ", e);
    }
});

// Listen for messages from the extension
window.addEventListener("LOAD_NS_MODULES", () => {
    try {
        if (typeof (window as any).require === "function") {
            (window as any).require(["N"], function (N: any) {
                (window as any).N = N;
                for (const n in N) {
                    (window as any)[n] = N[n];
                }
                console.log("NetSuite modules loaded:", N);
                console.log(
                    "Available as window.N and window[moduleName] (e.g., window.record, window.search)"
                );
            });
        } else {
            const m = "NetSuite require function not found. Are you on a NetSuite page?";
            console.error(m);
            alert(m);
        }
    } catch (e) {
        console.error("Error loading NetSuite modules: ", e);
    }
});

// Handle requests for NetSuite modules from the isolated content script world
window.addEventListener("message", (event) => {
    if (event.source !== window || event.data?.type !== "NS_MODULE_REQUEST") {
        return;
    }

    const { module: moduleName, requestId } = event.data;

    try {
        if (typeof (window as any).require !== "function") {
            window.postMessage(
                {
                    type: "NS_MODULE_RESPONSE",
                    requestId,
                    error: "NetSuite require function not available",
                },
                "*"
            );
            return;
        }

        (window as any).require(
            [`N/${moduleName}`],
            (nsModule: any) => {
                // We can't send the module directly (it won't survive serialization),
                // but we can call methods on it and send back the results
                // For currentRecord, we just need to call .get() and return the result
                if (moduleName === "currentRecord" && nsModule?.get) {
                    try {
                        const record = nsModule.get();
                        window.postMessage(
                            {
                                type: "NS_MODULE_RESPONSE",
                                requestId,
                                result: {
                                    id: record?.id,
                                    type: record?.type,
                                },
                            },
                            "*"
                        );
                    } catch (e) {
                        window.postMessage(
                            {
                                type: "NS_MODULE_RESPONSE",
                                requestId,
                                error: e instanceof Error ? e.message : String(e),
                            },
                            "*"
                        );
                    }
                } else {
                    window.postMessage(
                        {
                            type: "NS_MODULE_RESPONSE",
                            requestId,
                            error: `Module ${moduleName} not supported for cross-world messaging`,
                        },
                        "*"
                    );
                }
            },
            (err: Error) => {
                console.warn(`[load-modules] Failed to load N/${moduleName}:`, err);
                window.postMessage(
                    {
                        type: "NS_MODULE_RESPONSE",
                        requestId,
                        error: `Failed to load N/${moduleName}: ${err?.message || err}`,
                    },
                    "*"
                );
            }
        );
    } catch (e) {
        window.postMessage(
            {
                type: "NS_MODULE_RESPONSE",
                requestId,
                error: e instanceof Error ? e.message : String(e),
            },
            "*"
        );
    }
});
