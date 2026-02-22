"use client";

import { useEffect, useState } from "react";
import { useStickyNoteStore } from "@/stores/sticky-note.store";
import { StickyNoteCard } from "./StickyNoteCard";
import { AddStickyNoteDialog } from "./AddStickyNoteDialog";
import { Button } from "@/components/ui/button";
import { Pin, Plus, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

export function Pinboard() {
    const { notes, isLoading, fetchNotes } = useStickyNoteStore();
    const [search, setSearch] = useState("");
    const [isAddOpen, setIsAddOpen] = useState(false);

    useEffect(() => {
        fetchNotes();
    }, [fetchNotes]);

    const filteredNotes = notes.filter((note) =>
        note.title.toLowerCase().includes(search.toLowerCase()) ||
        note.content.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="flex flex-col gap-6 w-full">
            {/* Pinboard Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                        <Pin className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold tracking-tight">Pinboard</h2>
                        <p className="text-xs text-muted-foreground">
                            Team tips, book recommendations, and quick notes
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search notes..."
                            className="pl-9 h-9 text-xs"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Button
                        size="sm"
                        className="h-9 gap-2 text-xs"
                        onClick={() => setIsAddOpen(true)}
                    >
                        <Plus className="w-4 h-4" />
                        New Note
                    </Button>
                </div>
            </div>

            {/* Notes Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex flex-col gap-2 p-4 rounded-xl border">
                            <Skeleton className="h-4 w-3/4 rounded" />
                            <Skeleton className="h-20 w-full rounded" />
                        </div>
                    ))}
                </div>
            ) : filteredNotes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 rounded-2xl border-2 border-dashed border-muted-foreground/10">
                    <div className="p-4 rounded-full bg-muted/30 mb-4 text-muted-foreground/20">
                        <Pin className="w-12 h-12" />
                    </div>
                    <p className="font-medium text-muted-foreground">No notes found</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                        Try a different search or pin your first note
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {filteredNotes.map((note) => (
                        <StickyNoteCard key={note._id as unknown as string} note={note} />
                    ))}
                </div>
            )}

            <AddStickyNoteDialog open={isAddOpen} onOpenChange={setIsAddOpen} />
        </div>
    );
}
