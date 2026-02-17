/**
 * WAT (West Africa Time = UTC+1) timezone utilities
 * All server-side date logic should use these helpers to ensure
 * dates align with the WAT timezone.
 */

const WAT_OFFSET_HOURS = 1;

/**
 * Get the current Date object adjusted to WAT.
 * Useful for extracting date parts (year, month, day) in WAT.
 */
export function getNowInWAT(): Date {
    const now = new Date();
    return new Date(now.getTime() + WAT_OFFSET_HOURS * 60 * 60 * 1000);
}

/**
 * Get the start of today in WAT as a UTC Date (for MongoDB queries).
 * E.g. if it's 2024-02-17 in WAT, returns 2024-02-16T23:00:00.000Z (midnight WAT = 23:00 UTC previous day)
 */
export function getTodayStartWAT(): Date {
    const wat = getNowInWAT();
    const year = wat.getUTCFullYear();
    const month = wat.getUTCMonth();
    const day = wat.getUTCDate();
    // Midnight WAT = (midnight UTC) - 1 hour
    return new Date(Date.UTC(year, month, day, 0, 0, 0, 0) - WAT_OFFSET_HOURS * 60 * 60 * 1000);
}

/**
 * Get the start of tomorrow in WAT as a UTC Date (for MongoDB range queries).
 */
export function getTomorrowStartWAT(): Date {
    const todayStart = getTodayStartWAT();
    return new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
}

/**
 * Get a Date representing N days ago from now, suitable for cleanup queries.
 */
export function getDaysAgoWAT(days: number): Date {
    const now = new Date();
    return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}
