export function getInitials(name: string | undefined | null): string {
    if (!name) return "?";

    // Split by space and take first letter of each part
    const parts = name.trim().split(/\s+/);

    if (parts.length === 0) return "?";

    if (parts.length === 1) {
        // Just one name, take first 2 chars or 1 if only 1
        return parts[0].substring(0, 2).toUpperCase();
    }

    // Take first letter of first part and first letter of last part
    const first = parts[0].charAt(0);
    const last = parts[parts.length - 1].charAt(0);

    return (first + last).toUpperCase();
}
