/**
 * Load a NetSuite module using AMD-style require.
 * Must be called from MAIN world where NetSuite's require() is available.
 *
 * @param module - The NetSuite module name (e.g., "currentRecord", "record", "search")
 * @returns Promise resolving to the loaded module
 */
export const requireNetSuiteModule = <T = unknown>(module: string): Promise<T> => {
    return new Promise((resolve, reject) => {
        const win = window as Window & { require?: (deps: string[], cb: (m: T) => void) => void };

        if (typeof win.require !== "function") {
            reject(new Error("NetSuite require function not available"));
            return;
        }

        try {
            win.require([`N/${module}`], (nsModule: T) => {
                resolve(nsModule);
            });
        } catch (e) {
            reject(e instanceof Error ? e : new Error(String(e)));
        }
    });
};
