// Convert milliseconds to seconds (rounded to 2 decimal places)
export const formatTime = (ms) => {
    const seconds = ms / 1000;
    return `${seconds.toFixed(2)}s`;
};
