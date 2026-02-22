"use client";

import { IStickyNote, StickyNoteColor } from "@/models/sticky-note.model";
import { useStickyNoteStore } from "@/stores/sticky-note.store";
import { useAuthStore } from "@/stores/auth.store";
import {
    Pin,
    Trash2,
    MoreVertical,
    MessageSquare,
    Lightbulb,
    Bell,
    Target,
    StickyNote as NoteIcon
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const colorClasses: Record<StickyNoteColor, string> = {
    yellow: "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800/40 text-amber-900 dark:text-amber-100",
    blue: "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800/40 text-blue-900 dark:text-blue-100",
    green: "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-100",
    pink: "bg-pink-50 border-pink-200 dark:bg-pink-900/20 dark:border-pink-800/40 text-pink-900 dark:text-pink-100",
    purple: "bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800/40 text-purple-900 dark:text-purple-100",
};

const categoryIcons: any = {
    recommendation: MessageSquare,
    tip: Lightbulb,
    reminder: Bell,
    goal: Target,
    other: NoteIcon,
};

interface StickyNoteCardProps {
    note: IStickyNote;
}

export function StickyNoteCard({ note }: StickyNoteCardProps) {
    const { user } = useAuthStore();
    const { togglePin, deleteNote } = useStickyNoteStore();
    const CategoryIcon = categoryIcons[note.category] || NoteIcon;

    const isOwner = user?.id === note.createdBy.toString();
    const isAdmin = user?.role === "admin";

    return (
        <div
            className={cn(
                "relative group flex flex-col p-4 rounded-xl border transition-all duration-200 hover:shadow-md",
                colorClasses[note.color],
                note.isPinned && "ring-1 ring-primary/20"
            )}
        >
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                    <div className="p-1 rounded-md bg-white/50 dark:bg-black/20">
                        <CategoryIcon className="w-3.5 h-3.5" />
                    </div>
                    <h3 className="text-sm font-bold truncate leading-tight">
                        {note.title}
                    </h3>
                </div>

                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => togglePin(note._id as unknown as string)}
                        className={cn(
                            "p-1 rounded-md hover:bg-white/50 dark:hover:bg-black/20 transition-colors",
                            note.isPinned && "text-primary opacity-100"
                        )}
                    >
                        <Pin className={cn("w-3.5 h-3.5", note.isPinned && "fill-current")} />
                    </button>

                    {(isOwner || isAdmin) && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="p-1 rounded-md hover:bg-white/50 dark:hover:bg-black/20 transition-colors">
                                    <MoreVertical className="w-3.5 h-3.5" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => deleteNote(note._id as unknown as string)}
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </div>

            {/* Content */}
            <p className="text-xs leading-relaxed whitespace-pre-wrap flex-1">
                {note.content}
            </p>

            {/* Footer */}
            <div className="mt-3 pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[10px] opacity-60">
                <span>
                    {note.visibility === "team" ? "Team Space" : "Private Space"}
                </span>
                <span>
                    {new Date(note.createdAt).toLocaleDateString()}
                </span>
            </div>

            {note.isPinned && !isAdmin && !isOwner && (
                <div className="absolute top-1.5 right-1.5 opacity-100">
                    <Pin className="w-3 h-3 fill-current rotate-45 text-primary/40" />
                </div>
            )}
        </div>
    );
}
