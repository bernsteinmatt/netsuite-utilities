import { useEffect, useState } from "react";

interface CurrentRecordInfo {
    id: string | number | null;
    type: string | null;
}

/**
 * Hook to get the current record info from NetSuite's N/currentRecord module.
 * Uses postMessage to communicate with the MAIN world where NetSuite's require() is available.
 */
export const useCurrentRecord = () => {
    const [recordInfo, setRecordInfo] = useState<CurrentRecordInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const requestId = `current-record-${Date.now()}-${Math.random()}`;
        let timeoutId: ReturnType<typeof setTimeout>;

        const handleResponse = (event: MessageEvent) => {
            if (
                event.source !== window ||
                event.data?.type !== "NS_MODULE_RESPONSE" ||
                event.data?.requestId !== requestId
            ) {
                return;
            }

            clearTimeout(timeoutId);
            window.removeEventListener("message", handleResponse);

            if (event.data.error) {
                setError(event.data.error);
                setLoading(false);
            } else if (event.data.result) {
                setRecordInfo(event.data.result);
                setLoading(false);
            }
        };

        window.addEventListener("message", handleResponse);

        // Request the current record info from the MAIN world
        window.postMessage(
            {
                type: "NS_MODULE_REQUEST",
                module: "currentRecord",
                requestId,
            },
            "*"
        );

        // Timeout after 2 seconds
        timeoutId = setTimeout(() => {
            window.removeEventListener("message", handleResponse);
            setError("Timeout waiting for currentRecord module");
            setLoading(false);
        }, 2000);

        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener("message", handleResponse);
        };
    }, []);

    return { recordInfo, loading, error };
};
