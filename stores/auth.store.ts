import { create } from "zustand";

interface SessionUser {
    id: string;
    name: string;
    email: string;
    image?: string;
    expertise?: string;
    role?: string;
}

interface AuthStore {
    user: SessionUser | null;
    isLoading: boolean;
    setUser: (user: SessionUser | null) => void;
    setLoading: (loading: boolean) => void;
    clearAuth: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
    user: null,
    isLoading: true,
    setUser: (user) => set({ user, isLoading: false }),
    setLoading: (isLoading) => set({ isLoading }),
    clearAuth: () => set({ user: null, isLoading: false }),
}));
