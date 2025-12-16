import { useEffect, useState } from "react";

// NetSuite AMD-style require
declare global {
    interface Window {
        require: (deps: string[], callback: (...modules: unknown[]) => void) => void;
    }
}

export const useNetSuiteModule = ({ module }: { module: string }) => {
    const [nsModule, setModule] = useState<unknown>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!nsModule) {
            try {
                window.require([`N/${module}`], (netsuiteModule: unknown) => {
                    setModule(netsuiteModule);
                });
            } catch (e) {
                // Error occurred synchronously during require call, safe to set state here
                // since we're not in a render cycle - this is the initial effect run
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setError(e instanceof Error ? e.message : String(e));
            }
        }
    }, [module, nsModule]);

    return { module: nsModule, error };
};
