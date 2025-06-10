export const generateSharedCodeMap = (podIds: string[]) => {
    const timestamp = Date.now(); // hanya sekali
    const map = new Map();
    for (const podId of podIds) {
        map.set(podId, `${podId}-${timestamp}`);
    }
    return map;
};
