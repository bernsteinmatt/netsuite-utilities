export const mergeReducer = <T extends Record<string, unknown>>(
    currentState: T,
    action: Partial<T>
): T => ({ ...currentState, ...action });
