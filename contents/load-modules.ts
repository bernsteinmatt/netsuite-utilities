import type { PlasmoCSConfig } from "plasmo";

export const config: PlasmoCSConfig = {
    matches: ["*://*.netsuite.com/*"],
    world: "MAIN",
};

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
