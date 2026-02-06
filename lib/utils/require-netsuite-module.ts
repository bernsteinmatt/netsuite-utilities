/**
 * Load a NetSuite module using AMD-style require.
 * Must be called from MAIN world where NetSuite's require() is available.
 *
 * @param module - The NetSuite module name (e.g., "currentRecord", "record", "search")
 * @returns Promise resolving to the loaded module
 */
export const requireNetSuiteModule = <T = unknown>(module: string): Promise<T> => {
    return new Promise((resolve, reject) => {
        const win = window as Window & {
            require?: (deps: string[], cb: (m: T) => void, errback?: (err: Error) => void) => void;
        };

        if (typeof win.require !== "function") {
            console.warn(
                `[requireNetSuiteModule] window.require not available, cannot load N/${module}`
            );
            reject(new Error("NetSuite require function not available"));
            return;
        }

        try {
            win.require(
                [`N/${module}`],
                (nsModule: T) => {
                    resolve(nsModule);
                },
                (err: Error) => {
                    reject(err);
                }
            );
        } catch (e) {
            reject(e instanceof Error ? e : new Error(String(e)));
        }
    });
};
