/**
 * Format a date string to a human-readable format
 */
export function formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

/**
 * Format a date to relative time (e.g., "2 days ago", "in 3 hours")
 */
export function formatRelativeTime(date: string | Date): string {
    const now = new Date();
    const target = new Date(date);
    const diffMs = target.getTime() - now.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays === -1) return "Yesterday";
    if (diffDays > 0) return `In ${diffDays} days`;
    return `${Math.abs(diffDays)} days ago`;
}

/**
 * Calculate days remaining until a deadline
 */
export function daysUntilDeadline(deadline: string | Date): number {
    const now = new Date();
    const target = new Date(deadline);
    return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Check if a deadline is approaching (within 24 hours)
 */
export function isDeadlineApproaching(deadline: string | Date): boolean {
    return daysUntilDeadline(deadline) <= 1 && daysUntilDeadline(deadline) >= 0;
}

/**
 * Check if a deadline has passed
 */
export function isOverdue(deadline: string | Date): boolean {
    return daysUntilDeadline(deadline) < 0;
}

/**
 * Format minutes to hours and minutes display
 */
export function formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
}

/**
 * Format date to ISO date string (YYYY-MM-DD)
 */
export function toISODateString(date: Date): string {
    return date.toISOString().split("T")[0];
}
