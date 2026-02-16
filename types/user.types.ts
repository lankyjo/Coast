import { Role } from "@/constants/roles";
import { Expertise } from "@/constants/expertise";

export interface User {
    _id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image?: string;
    expertise: Expertise;
    role: Role;
    createdAt: string;
    updatedAt: string;
}

export interface SessionUser {
    id: string;
    name: string;
    email: string;
    image?: string;
    expertise: Expertise;
    role: Role;
}
