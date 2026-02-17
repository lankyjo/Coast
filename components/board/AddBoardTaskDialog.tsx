"use client";

import { useState } from "react";
import { useProjectStore } from "@/stores/project.store";
import { useUserStore } from "@/stores/user.store";
import { useBoardStore } from "@/stores/board.store";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, ChevronsUpDown, Eye, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { PRIORITY_LABELS, PRIORITY_ORDER } from "@/constants/priority";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { DatePickerWithPresets } from "@/components/ui/date-picker-with-presets";

interface AddBoardTaskDialogProps {
    boardId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AddBoardTaskDialog({ boardId, open, onOpenChange }: AddBoardTaskDialogProps) {
    const { projects } = useProjectStore();
    const { users } = useUserStore();
    const { addTaskToBoard } = useBoardStore();

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [projectId, setProjectId] = useState("");
    const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
    const [priority, setPriority] = useState("medium");
    const [visibility, setVisibility] = useState<"general" | "private">("general");
    const [deadline, setDeadline] = useState<Date | undefined>(undefined);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!title.trim() || !description.trim() || !projectId) {
            setError("Title, description, and project are required.");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        const result = await addTaskToBoard(boardId, {
            title: title.trim(),
            description: description.trim(),
            projectId,
            assigneeIds: assigneeIds.length > 0 ? assigneeIds : undefined,
            priority,
            visibility,
            deadline: deadline ? deadline.toISOString() : undefined,
        });

        if (result.success) {
            // Reset form
            setTitle("");
            setDescription("");
            setProjectId("");
            setAssigneeIds([]);
            setPriority("medium");
            setVisibility("general");
            setDeadline(undefined);
            onOpenChange(false);
        } else {
            setError(result.error || "Failed to add task");
        }

        setIsSubmitting(false);
    };

    const toggleAssignee = (userId: string) => {
        setAssigneeIds((prev) =>
            prev.includes(userId)
                ? prev.filter((id) => id !== userId)
                : [...prev, userId]
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle className="text-lg font-bold">
                        Add Task to Board
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {error && (
                        <div className="rounded-md bg-destructive/15 px-3 py-2 text-sm text-destructive">
                            {error}
                        </div>
                    )}

                    {/* Title */}
                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Title</Label>
                        <Input
                            placeholder="Enter task title..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="h-9"
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Description</Label>
                        <Textarea
                            placeholder="Enter task description..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="resize-none text-sm"
                        />
                    </div>

                    {/* Project */}
                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Project</Label>
                        <Select value={projectId} onValueChange={setProjectId}>
                            <SelectTrigger className="h-9">
                                <SelectValue placeholder="Select a project" />
                            </SelectTrigger>
                            <SelectContent>
                                {projects.map((p: any) => (
                                    <SelectItem key={p._id.toString()} value={p._id.toString()}>
                                        {p.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Priority + Visibility Row */}
                    <div className="grid grid-cols-2 gap-3">
                        {/* Priority */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">Priority</Label>
                            <Select value={priority} onValueChange={setPriority}>
                                <SelectTrigger className="h-9">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {PRIORITY_ORDER.map((p) => (
                                        <SelectItem key={p} value={p}>
                                            {PRIORITY_LABELS[p]}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Visibility */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">Visibility</Label>
                            <Select
                                value={visibility}
                                onValueChange={(v) => setVisibility(v as "general" | "private")}
                            >
                                <SelectTrigger className="h-9">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="general">
                                        <span className="flex items-center gap-1.5">
                                            <Globe className="h-3 w-3" />
                                            General
                                        </span>
                                    </SelectItem>
                                    <SelectItem value="private">
                                        <span className="flex items-center gap-1.5">
                                            <Eye className="h-3 w-3" />
                                            Private
                                        </span>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Deadline */}
                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Due Date</Label>
                        <DatePickerWithPresets
                            date={deadline}
                            setDate={setDeadline}
                        />
                    </div>

                    {/* Assignees */}
                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Assignees</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full justify-between h-9 text-xs"
                                >
                                    {assigneeIds.length > 0
                                        ? `${assigneeIds.length} member${assigneeIds.length > 1 ? "s" : ""} selected`
                                        : "Select members"}
                                    <ChevronsUpDown className="ml-2 h-3.5 w-3.5 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[300px] p-0" align="start">
                                <Command>
                                    <CommandInput placeholder="Search users..." />
                                    <CommandList>
                                        <CommandEmpty>No users found.</CommandEmpty>
                                        <CommandGroup>
                                            {users.map((u) => {
                                                const isSelected = assigneeIds.includes(u.id);
                                                return (
                                                    <CommandItem
                                                        key={u.id}
                                                        onSelect={() => toggleAssignee(u.id)}
                                                    >
                                                        <div
                                                            className={cn(
                                                                "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                                                isSelected
                                                                    ? "bg-primary text-primary-foreground"
                                                                    : "opacity-50 [&_svg]:invisible"
                                                            )}
                                                        >
                                                            <Check className="h-4 w-4" />
                                                        </div>
                                                        <Avatar className="h-5 w-5 mr-2">
                                                            <AvatarImage src={u.image} />
                                                            <AvatarFallback className="text-[8px] font-bold">
                                                                {u.name?.charAt(0) || "?"}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <span className="text-sm truncate">{u.name}</span>
                                                    </CommandItem>
                                                );
                                            })}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>

                        {/* Selected avatars */}
                        {assigneeIds.length > 0 && (
                            <div className="flex -space-x-1.5 mt-1.5">
                                {assigneeIds.map((id) => {
                                    const u = users.find((u) => u.id === id);
                                    return (
                                        <Avatar key={id} className="h-6 w-6 border-2 border-background">
                                            <AvatarImage src={u?.image} />
                                            <AvatarFallback className="text-[8px] bg-muted font-bold">
                                                {u?.name?.charAt(0) || "?"}
                                            </AvatarFallback>
                                        </Avatar>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? "Adding..." : "Add Task"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
