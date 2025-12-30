/**
 * Proxy fetch helper for side panel to content script communication.
 *
 * The side panel runs in a separate context and doesn't have access to
 * the NetSuite page's authentication cookies/session. This helper allows
 * the side panel to proxy fetch requests through the content script.
 */

export interface ProxyFetchRequest {
    url: string;
    options?: SerializedRequestInit;
}

export interface ProxyFetchResponse {
    ok: boolean;
    status: number;
    statusText: string;
    data: unknown;
    error?: string;
}

export interface SerializedRequestInit {
    method?: string;
    headers?: Record<string, string> | HeadersInit;
    body?: string;
    mode?: RequestMode;
    credentials?: RequestCredentials;
    cache?: RequestCache;
    redirect?: RequestRedirect;
    referrer?: string;
    referrerPolicy?: ReferrerPolicy;
}

/**
 * Determines if the current context is a side panel (not the content script).
 */
export const isSidePanelContext = (): boolean => {
    try {
        // Side panel runs with chrome-extension:// protocol
        // Content scripts run with the page's protocol (https://)
        return window.location.protocol === "chrome-extension:";
    } catch {
        return false;
    }
};

/**
 * Proxy a fetch request through the content script.
 * Used by the side panel to make authenticated requests to NetSuite.
 *
 * Flow:
 * 1. Side panel calls proxyFetch(url, options)
 * 2. Message sent to content script with PROXY_FETCH action
 * 3. Content script makes the actual fetch() with page's auth cookies
 * 4. Content script returns serialized response
 * 5. This function wraps the response in a Response-like object
 */
export const proxyFetch = async (url: string, options?: RequestInit): Promise<Response> => {
    return new Promise((resolve, reject) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const tabId = tabs[0]?.id;

            if (!tabId) {
                reject(new Error("No active tab found"));
                return;
            }

            const serializedOptions = serializeRequestInit(options);

            chrome.tabs.sendMessage(
                tabId,
                {
                    action: "PROXY_FETCH",
                    payload: { url, options: serializedOptions },
                } as { action: string; payload: ProxyFetchRequest },
                (response: ProxyFetchResponse) => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                        return;
                    }

                    if (!response) {
                        reject(new Error("No response from content script"));
                        return;
                    }

                    if (response.error) {
                        reject(new Error(response.error));
                        return;
                    }

                    // Wrap the serialized response in a Response-like object
                    const wrappedResponse = {
                        ok: response.ok,
                        status: response.status,
                        statusText: response.statusText,
                        json: async () => response.data,
                        text: async () =>
                            typeof response.data === "string"
                                ? response.data
                                : JSON.stringify(response.data),
                    } as Response;

                    resolve(wrappedResponse);
                }
            );
        });
    });
};

/**
 * Serialize RequestInit for message passing.
 */
const serializeRequestInit = (options?: RequestInit): SerializedRequestInit | undefined => {
    if (!options) return undefined;

    return {
        method: options.method,
        headers: options.headers as Record<string, string>,
        body: options.body as string,
        mode: options.mode,
        credentials: options.credentials,
        cache: options.cache,
        redirect: options.redirect,
        referrer: options.referrer,
        referrerPolicy: options.referrerPolicy,
    };
};

/**
 * Handler for PROXY_FETCH messages in the content script.
 * This performs the actual fetch using the page's authentication context.
 */
export const handleProxyFetch = async (payload: ProxyFetchRequest): Promise<ProxyFetchResponse> => {
    try {
        // If URL is relative, prepend the current origin
        let fullUrl = payload.url;
        if (payload.url.startsWith("/")) {
            fullUrl = window.location.origin + payload.url;
        }

        const response = await fetch(fullUrl, payload.options as RequestInit);

        // Try to parse as JSON first, fall back to text if that fails
        let data: unknown;
        const text = await response.text();
        try {
            data = JSON.parse(text);
        } catch {
            data = text;
        }

        return {
            ok: response.ok,
            status: response.status,
            statusText: response.statusText,
            data,
        };
    } catch (error) {
        return {
            ok: false,
            status: 0,
            statusText: "Network Error",
            data: null,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
};
