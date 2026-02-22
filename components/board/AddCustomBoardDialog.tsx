"use client";

import { useState } from "react";
import { useCustomBoardStore } from "@/stores/custom-board.store";
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
import { Loader2, Layout, Briefcase, Target, ListTodo, Hash } from "lucide-react";

interface AddCustomBoardDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const icons = [
    { name: "Layout", value: "Layout", icon: Layout },
    { name: "Projects", value: "Briefcase", icon: Briefcase },
    { name: "Goals", value: "Target", icon: Target },
    { name: "Checklist", value: "ListTodo", icon: ListTodo },
    { name: "General", value: "Hash", icon: Hash },
];

export function AddCustomBoardDialog({ open, onOpenChange }: AddCustomBoardDialogProps) {
    const { createBoard } = useCustomBoardStore();
    const [isLoading, setIsLoading] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [icon, setIcon] = useState("Layout");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsLoading(true);
        try {
            const result = await createBoard({
                name,
                description,
                icon,
            });
            if (result.success) {
                onOpenChange(false);
                setName("");
                setDescription("");
                setIcon("Layout");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Create Custom Board</DialogTitle>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Board Name</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Marketing Site"
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="description">Description (Optional)</Label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="What is this board for?"
                                className="min-h-[80px]"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>Icon</Label>
                            <Select value={icon} onValueChange={setIcon}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {icons.map((i) => (
                                        <SelectItem key={i.value} value={i.value}>
                                            <div className="flex items-center gap-2">
                                                <i.icon className="h-4 w-4" />
                                                <span>{i.name}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Create Board
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
