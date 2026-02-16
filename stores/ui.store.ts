import { create } from "zustand";

interface UIState {
    // Desktop: sidebar collapsed to icon-only
    isSidebarCollapsed: boolean;
    // Mobile: sheet open/closed
    isMobileSheetOpen: boolean;
    activeModal: string | null;
    modalProps: any;

    // Actions
    toggleSidebar: () => void;
    setSidebarCollapsed: (collapsed: boolean) => void;
    setMobileSheetOpen: (isOpen: boolean) => void;
    openModal: (modalName: string, props?: any) => void;
    closeModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
    isSidebarCollapsed: false, // Desktop: expanded by default
    isMobileSheetOpen: false,  // Mobile: closed by default
    activeModal: null,
    modalProps: {},

    toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),

    setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),

    setMobileSheetOpen: (isOpen) => set({ isMobileSheetOpen: isOpen }),

    openModal: (modalName, props = {}) => set({ activeModal: modalName, modalProps: props }),

    closeModal: () => set({ activeModal: null, modalProps: {} }),
}));

// Backward-compat aliases
export const useSidebarOpen = () => {
    const { isMobileSheetOpen, setMobileSheetOpen } = useUIStore();
    return {
        isSidebarOpen: isMobileSheetOpen,
        setSidebarOpen: setMobileSheetOpen,
    };
};
