export const executeQuery = async (query: string): Promise<{ error: string | null; data: any }> => {
    try {
        const fetchBody = {
            method: "remoteObject.bridgeCall",
            params: [
                "queryApiBridge",
                "runSuiteQL",
                `["${query.replaceAll("\n", "\\n")}","[]","SUITE_QL",""]`,
            ],
        };

        const nsResponse = await fetch(
            "/app/common/scripting/PlatformClientScriptHandler.nl?script=&deploy=",
            {
                headers: {
                    accept: "*/*",
                    "accept-language": "en-US,en;q=0.9",
                    "cache-control": "no-cache",
                    "content-type": "text/plain;charset=UTF-8",
                },
                referrerPolicy: "strict-origin-when-cross-origin",
                body: JSON.stringify(fetchBody),
                method: "POST",
                mode: "cors",
                credentials: "include",
            }
        );

        if (!nsResponse.ok) {
            const errorResponse = await nsResponse.text();
            throw new Error(`Error response: ${errorResponse}`);
        }

        const data = await nsResponse.json();

        if (data.code) {
            throw new Error(`${data.code}\n\n${data.details}`);
        }
        return { error: null, data };
    } catch (error: any) {
        return { error: error.message, data: null };
    }
};
