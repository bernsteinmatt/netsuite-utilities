const IS_DEV = process.env.NODE_ENV === "development";

export const debugLog = (prefix: string, ...args: unknown[]) => {
    if (IS_DEV) {
        console.log(`[${prefix}]`, ...args);
    }
};

export const debugError = (prefix: string, ...args: unknown[]) => {
    if (IS_DEV) {
        console.error(`[${prefix}]`, ...args);
    }
};
