export const ROLES = {
    ADMIN: "admin",
    MEMBER: "member",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];
