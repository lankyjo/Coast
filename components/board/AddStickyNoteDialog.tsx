"use client";

import { useState } from "react";
import { useStickyNoteStore } from "@/stores/sticky-note.store";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { StickyNoteColor, StickyNoteCategory } from "@/models/sticky-note.model";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddStickyNoteDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const colors: { name: string; value: StickyNoteColor; class: string }[] = [
    { name: "Yellow", value: "yellow", class: "bg-amber-100 border-amber-300" },
    { name: "Blue", value: "blue", class: "bg-blue-100 border-blue-300" },
    { name: "Green", value: "green", class: "bg-emerald-100 border-emerald-300" },
    { name: "Pink", value: "pink", class: "bg-pink-100 border-pink-300" },
    { name: "Purple", value: "purple", class: "bg-purple-100 border-purple-300" },
];

export function AddStickyNoteDialog({ open, onOpenChange }: AddStickyNoteDialogProps) {
    const { createNote } = useStickyNoteStore();
    const [isLoading, setIsLoading] = useState(false);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [color, setColor] = useState<StickyNoteColor>("yellow");
    const [category, setCategory] = useState<StickyNoteCategory>("other");
    const [visibility, setVisibility] = useState<"team" | "personal">("personal");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) return;

        setIsLoading(true);
        try {
            const result = await createNote({
                title,
                content,
                color,
                category,
                visibility,
            });
            if (result.success) {
                onOpenChange(false);
                resetForm();
            }
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setTitle("");
        setContent("");
        setColor("yellow");
        setCategory("other");
        setVisibility("personal");
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Add a Sticky Note</DialogTitle>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="title">Title</Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="What's this about?"
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="content">Content</Label>
                            <Textarea
                                id="content"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Write your thoughts..."
                                className="min-h-[100px]"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Category</Label>
                                <Select
                                    value={category}
                                    onValueChange={(v) => setCategory(v as any)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="recommendation">Recommendation</SelectItem>
                                        <SelectItem value="tip">Tip</SelectItem>
                                        <SelectItem value="reminder">Reminder</SelectItem>
                                        <SelectItem value="goal">Goal</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label>Visibility</Label>
                                <Select
                                    value={visibility}
                                    onValueChange={(v) => setVisibility(v as any)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="personal">Personal only</SelectItem>
                                        <SelectItem value="team">Team wide</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label>Color</Label>
                            <div className="flex gap-2.5 pt-1">
                                {colors.map((c) => (
                                    <button
                                        key={c.value}
                                        type="button"
                                        onClick={() => setColor(c.value)}
                                        className={cn(
                                            "w-7 h-7 rounded-full border-2 transition-transform hover:scale-110",
                                            c.class,
                                            color === c.value ? "border-primary scale-110" : "border-transparent"
                                        )}
                                        title={c.name}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Pin Note
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
