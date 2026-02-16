import { create } from "zustand";

interface UIState {
    isSidebarOpen: boolean;
    activeModal: string | null;
    modalProps: any;

    // Actions
    toggleSidebar: () => void;
    setSidebarOpen: (isOpen: boolean) => void;
    openModal: (modalName: string, props?: any) => void;
    closeModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
    isSidebarOpen: true, // Default open on desktop
    activeModal: null,
    modalProps: {},

    toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

    setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),

    openModal: (modalName, props = {}) => set({ activeModal: modalName, modalProps: props }),

    closeModal: () => set({ activeModal: null, modalProps: {} }),
}));
