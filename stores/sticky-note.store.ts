import { create } from "zustand";
import { IStickyNote } from "@/models/sticky-note.model";
import {
    createStickyNoteAction,
    getStickyNotesAction,
    updateStickyNoteAction,
    deleteStickyNoteAction,
    togglePinStickyNoteAction,
} from "@/actions/sticky-note.actions";

interface StickyNoteState {
    notes: IStickyNote[];
    isLoading: boolean;
    error: string | null;

    // Actions
    fetchNotes: () => Promise<void>;
    createNote: (data: any) => Promise<{ success: boolean; error?: string }>;
    updateNote: (id: string, data: any) => Promise<void>;
    deleteNote: (id: string) => Promise<void>;
    togglePin: (id: string) => Promise<void>;
}

export const useStickyNoteStore = create<StickyNoteState>((set, get) => ({
    notes: [],
    isLoading: false,
    error: null,

    fetchNotes: async () => {
        set({ isLoading: true, error: null });
        try {
            const result = await getStickyNotesAction();
            if (result.success && result.data) {
                set({ notes: result.data as IStickyNote[] });
            } else {
                set({ error: result.error || "Failed to fetch sticky notes" });
            }
        } catch {
            set({ error: "An unexpected error occurred" });
        } finally {
            set({ isLoading: false });
        }
    },

    createNote: async (data) => {
        try {
            const result = await createStickyNoteAction(data);
            if (result.success && result.data) {
                set((state) => ({
                    notes: [result.data as IStickyNote, ...state.notes].sort(
                        (a, b) => {
                            if (a.isPinned === b.isPinned) {
                                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                            }
                            return a.isPinned ? -1 : 1;
                        }
                    ),
                }));
                return { success: true };
            }
            return { success: false, error: result.error };
        } catch {
            return { success: false, error: "An unexpected error occurred" };
        }
    },

    updateNote: async (id, data) => {
        try {
            const result = await updateStickyNoteAction(id, data);
            if (result.success && result.data) {
                set((state) => ({
                    notes: state.notes.map((n) =>
                        (n._id as any).toString() === id ? (result.data as IStickyNote) : n
                    ),
                }));
            }
        } catch {
            set({ error: "Failed to update sticky note" });
        }
    },

    deleteNote: async (id) => {
        try {
            const result = await deleteStickyNoteAction(id);
            if (result.success) {
                set((state) => ({
                    notes: state.notes.filter((n) => (n._id as any).toString() !== id),
                }));
            }
        } catch {
            set({ error: "Failed to delete sticky note" });
        }
    },

    togglePin: async (id) => {
        try {
            const result = await togglePinStickyNoteAction(id);
            if (result.success && result.data) {
                const updatedNote = result.data as IStickyNote;
                set((state) => ({
                    notes: state.notes
                        .map((n) => ((n._id as any).toString() === id ? updatedNote : n))
                        .sort((a, b) => {
                            if (a.isPinned === b.isPinned) {
                                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                            }
                            return a.isPinned ? -1 : 1;
                        }),
                }));
            }
        } catch {
            set({ error: "Failed to toggle pin" });
        }
    },
}));
