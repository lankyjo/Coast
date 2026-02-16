import { create } from "zustand";
import { getUsers } from "@/actions/user.actions";

interface User {
    id: string;
    name: string;
    email: string;
    image?: string;
    role: string;
    expertise?: string;
}

interface UserState {
    users: User[];
    isLoading: boolean;
    error: string | null;

    // Actions
    fetchUsers: () => Promise<void>;
}

export const useUserStore = create<UserState>((set) => ({
    users: [],
    isLoading: false,
    error: null,

    fetchUsers: async () => {
        set({ isLoading: true, error: null });
        try {
            const result = await getUsers();
            if (result.success && result.data) {
                set({ users: result.data });
            } else {
                set({ error: result.error || "Failed to fetch users" });
            }
        } catch (error) {
            set({ error: "An unexpected error occurred" });
        } finally {
            set({ isLoading: false });
        }
    },
}));
