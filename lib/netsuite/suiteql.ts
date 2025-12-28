import { isNetSuite } from "@/lib/is-netsuite";
import { mockData as defaultMockData } from "@/lib/mock-data";
import { isSidePanelContext, proxyFetch } from "@/lib/proxy-fetch";

export const escapeSqlString = (value: string): string => {
    // Escape single quotes by doubling them
    // Strip double quotes - SuiteQL doesn't support them in LIKE patterns
    return value.replace(/'/g, "''").replace(/"/g, "");
};

const NETSUITE_QUERY_URL = "/app/common/scripting/PlatformClientScriptHandler.nl?script=&deploy=";

const NETSUITE_FETCH_OPTIONS: RequestInit = {
    headers: {
        accept: "*/*",
        "accept-language": "en-US,en;q=0.9",
        "cache-control": "no-cache",
        "content-type": "text/plain;charset=UTF-8",
    },
    referrerPolicy: "strict-origin-when-cross-origin",
    method: "POST",
    mode: "cors",
    credentials: "include",
};

export const executeQuery = async (
    query: string,
    { mockData = defaultMockData, timeout = 1500 } = {}
): Promise<{ error: string | null; data: any }> => {
    try {
        const fetchBody = {
            method: "remoteObject.bridgeCall",
            params: [
                "queryApiBridge",
                "runSuiteQL",
                `["${query.replaceAll("\n", "\\n")}","[]","SUITE_QL",""]`,
            ],
        };

        const inSidePanel = isSidePanelContext();
        const inNetSuite = isNetSuite();

        if (!inNetSuite && !inSidePanel) {
            await new Promise((resolve) => setTimeout(resolve, timeout));
            return { data: mockData, error: null };
        }

        // Use proxy fetch if in side panel, otherwise direct fetch
        const fetchFn = inSidePanel ? proxyFetch : fetch;
        const nsResponse = await fetchFn(NETSUITE_QUERY_URL, {
            ...NETSUITE_FETCH_OPTIONS,
            body: JSON.stringify(fetchBody),
        });

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

interface NetSuiteQueryResponse {
    count: number;
    aliases: string[];
    [key: string]: unknown;
}

const convertNetSuiteResponse = <T>(response: NetSuiteQueryResponse): T[] => {
    const result: T[] = [];

    for (let i = 0; i < response.count; i++) {
        const rowKey = `v${i}`;
        const row = response[rowKey];

        if (!row || !Array.isArray(row)) {
            continue;
        }

        const obj = {} as T;
        response.aliases.forEach((alias, index) => {
            (obj as Record<string, unknown>)[alias] = row[index];
        });

        result.push(obj);
    }

    return result;
};

export const fetchQuery = async <T = Record<string, unknown>>(
    query: string,
    options: { mockData?: T[]; timeout?: number } = {}
): Promise<{ error: string | null; data: T[] | null }> => {
    const { error, data } = await executeQuery(query, options as { mockData?: any[]; timeout?: number });

    if (error) {
        return { error, data: null };
    }

    // Mock data is already an array, NetSuite returns { result: { result: { v0, v1, ..., aliases, count } } }
    if (Array.isArray(data)) {
        return { error: null, data };
    }

    const nsResponse = data?.result?.result as NetSuiteQueryResponse | undefined;
    if (nsResponse?.aliases && typeof nsResponse.count === "number") {
        const items = convertNetSuiteResponse<T>(nsResponse);
        return { error: null, data: items };
    }

    return { error: null, data: [] };
};
