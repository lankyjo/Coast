"use client";

import { useState } from "react";
import { useTaskStore } from "@/stores/task.store";
import { useProjectStore } from "@/stores/project.store";
import { useUserStore } from "@/stores/user.store";
import { useBoardStore } from "@/stores/board.store";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, ChevronsUpDown, Eye, Globe, Sparkles, Loader2, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { PRIORITY_LABELS, PRIORITY_ORDER } from "@/constants/priority";
import { DatePickerWithPresets } from "@/components/ui/date-picker-with-presets";
import { getInitials } from "@/lib/user-utils";
import { toast } from "sonner";
import { suggestAssignee, breakDownTask, suggestDeadline } from "@/actions/ai.actions";
import { AISuggestion, AITaskBreakdown, AIDeadlineSuggestion } from "@/types/ai.types";
import { AITaskDialog } from "@/components/tasks/AITaskDialog";
import { createTaskSchema } from "@/utils/validation";

interface CreateTaskFormProps {
    projectId?: string; // If provided, project select is hidden
    boardId?: string;   // If provided, adds to board
    onSuccess: () => void;
    onCancel: () => void;
}

export function CreateTaskForm({ projectId: defaultProjectId, boardId, onSuccess, onCancel }: CreateTaskFormProps) {
    const { createTask } = useTaskStore();
    const { addTaskToBoard } = useBoardStore();
    const { projects } = useProjectStore();
    const { users } = useUserStore();

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [projectId, setProjectId] = useState(defaultProjectId || "");
    const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
    const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
    const [visibility, setVisibility] = useState<"general" | "private">("general");
    const [startDate, setStartDate] = useState<Date | undefined>(undefined);
    const [deadline, setDeadline] = useState<Date | undefined>(undefined);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // AI State
    const [isAIDraftOpen, setIsAIDraftOpen] = useState(false);
    const [aiLoading, setAiLoading] = useState<"assignee" | "breakdown" | "deadline" | null>(null);
    const [aiSuggestions, setAiSuggestions] = useState<{
        assignee: AISuggestion | null;
        breakdown: AITaskBreakdown | null;
        deadline: AIDeadlineSuggestion | null;
    }>({
        assignee: null,
        breakdown: null,
        deadline: null,
    });

    const handleSubmit = async () => {
        const taskDataRaw = {
            title: title.trim(),
            description: description.trim(),
            projectId,
            assigneeIds: assigneeIds.length > 0 ? assigneeIds : undefined,
            priority,
            visibility,
            startDate: startDate ? startDate.toISOString() : undefined,
            deadline: deadline ? deadline.toISOString() : undefined,
        };

        const validation = createTaskSchema.safeParse(taskDataRaw);

        if (!validation.success) {
            const fieldErrors: Record<string, string> = {};
            validation.error.issues.forEach((err: any) => {
                if (err.path[0]) {
                    fieldErrors[err.path[0].toString()] = err.message;
                }
            });
            setErrors(fieldErrors);
            toast.error("Please fill in all required fields correctly");
            return;
        }

        setErrors({});
        setIsSubmitting(true);

        try {
            const taskData = validation.data as any;

            let result;
            if (boardId) {
                result = await addTaskToBoard(boardId, taskData);
            } else {
                result = await createTask(taskData);
            }

            if (result.success) {
                toast.success("Task created successfully");
                onSuccess();
            } else {
                toast.error(result.error || "Failed to create task");
            }
        } catch (e) {
            toast.error("An error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAITaskGenerated = (data: any) => {
        setTitle(data.title);
        setDescription(data.description);
        setPriority(data.priority);
        if (data.deadline) setDeadline(new Date(data.deadline));
        // Reset suggestions
        setAiSuggestions({ assignee: null, breakdown: null, deadline: null });
    };

    const toggleAssignee = (userId: string) => {
        setAssigneeIds((prev) =>
            prev.includes(userId)
                ? prev.filter((id) => id !== userId)
                : [...prev, userId]
        );
    };

    return (
        <div className="space-y-4 py-2">
            <div className="flex justify-end">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAIDraftOpen(true)}
                    className="text-xs border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
                >
                    <Sparkles className="mr-2 h-3 w-3" />
                    AI Draft
                </Button>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Title <span className="text-red-500">*</span></Label>
                <Input
                    placeholder="Enter task title..."
                    value={title}
                    onChange={(e) => {
                        setTitle(e.target.value);
                        if (errors.title) setErrors(prev => ({ ...prev, title: "" }));
                    }}
                    className={cn("h-9", errors.title && "border-red-500 focus-visible:ring-red-500")}
                    autoFocus
                />
                {errors.title && <p className="text-[10px] text-red-500">{errors.title}</p>}
            </div>

            {/* Project (if not pre-selected) */}
            {!defaultProjectId && (
                <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Project <span className="text-red-500">*</span></Label>
                    <Select
                        value={projectId}
                        onValueChange={(v) => {
                            setProjectId(v);
                            if (errors.projectId) setErrors(prev => ({ ...prev, projectId: "" }));
                        }}
                    >
                        <SelectTrigger className={cn("h-9", errors.projectId && "border-red-500 focus:ring-red-500")}>
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
                    {errors.projectId && <p className="text-[10px] text-red-500">{errors.projectId}</p>}
                </div>
            )}

            {/* Description + AI Breakdown */}
            <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold">Description <span className="text-red-500">*</span></Label>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2"
                        onClick={async () => {
                            if (!title) return toast.error("Please enter a title first");
                            setAiLoading("breakdown");
                            const res = await breakDownTask(title, description);
                            setAiLoading(null);
                            if (res.success) setAiSuggestions(p => ({ ...p, breakdown: res.data || null }));
                            else toast.error(res.error);
                        }}
                        disabled={!!aiLoading || !title}
                    >
                        {aiLoading === "breakdown" ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1 h-3 w-3" />}
                        Break Down
                    </Button>
                </div>
                <Textarea
                    placeholder="Enter task description..."
                    value={description}
                    onChange={(e) => {
                        setDescription(e.target.value);
                        if (errors.description) setErrors(prev => ({ ...prev, description: "" }));
                    }}
                    rows={3}
                    className={cn("resize-none text-sm", errors.description && "border-red-500 focus-visible:ring-red-500")}
                />
                {errors.description && <p className="text-[10px] text-red-500">{errors.description}</p>}
            </div>

            {/* AI Breakdown Suggestion */}
            {aiSuggestions.breakdown && (
                <div className="rounded-md border border-blue-200 bg-blue-50/50 p-3 text-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-blue-900 flex items-center gap-2 text-xs">
                            <Sparkles className="h-3 w-3 text-blue-600" />
                            AI Suggestion: Break Down
                        </span>
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-5 text-[10px] px-2"
                                onClick={() => setAiSuggestions(p => ({ ...p, breakdown: null }))}
                            >
                                Dismiss
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-5 text-[10px] border-blue-200 bg-white hover:bg-blue-50 text-blue-700 px-2"
                                onClick={() => {
                                    const text = aiSuggestions.breakdown?.subtasks
                                        .map((s: any) => `- ${s.title} (${s.estimatedMinutes}m)`).join("\n");
                                    setDescription(prev => prev ? `${prev}\n\nSubtasks:\n${text}` : `Subtasks:\n${text}`);
                                    setAiSuggestions(p => ({ ...p, breakdown: null }));
                                }}
                            >
                                Append
                            </Button>
                        </div>
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-slate-700 text-xs">
                        {aiSuggestions.breakdown?.subtasks.map((s: any, i: number) => (
                            <li key={i}>{s.title} <span className="text-slate-500">({s.estimatedMinutes}m)</span></li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Priority + Visibility */}
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Priority</Label>
                    <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
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
                <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Visibility</Label>
                    <Select value={visibility} onValueChange={(v: any) => setVisibility(v)}>
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

            {/* Dates (Start Date + Deadline) + AI Suggestion */}
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Start Date</Label>
                    <DatePickerWithPresets
                        date={startDate}
                        setDate={setStartDate}
                    />
                </div>
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold">Due Date <span className="text-red-500">*</span></Label>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50 px-2"
                            onClick={async () => {
                                if (!title) return toast.error("Please enter a title first");
                                setAiLoading("deadline");
                                const res = await suggestDeadline(title, description, priority);
                                setAiLoading(null);
                                if (res.success) setAiSuggestions(p => ({ ...p, deadline: res.data || null }));
                                else toast.error(res.error);
                            }}
                            disabled={!!aiLoading || !title}
                        >
                            {aiLoading === "deadline" ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1 h-3 w-3" />}
                            Suggest
                        </Button>
                    </div>

                    {/* AI Deadline Suggestion */}
                    {aiSuggestions.deadline && (
                        <div className="rounded-md border border-amber-200 bg-amber-50/50 p-2 text-sm mb-1">
                            <div className="flex items-center justify-between">
                                <span className="font-medium text-amber-900 flex items-center gap-2 text-xs">
                                    <Sparkles className="h-3 w-3 text-amber-600" />
                                    {new Date(aiSuggestions.deadline.suggestedDeadline).toLocaleDateString()}
                                </span>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-5 text-[10px] px-2"
                                        onClick={() => setAiSuggestions(p => ({ ...p, deadline: null }))}
                                    >
                                        Dismiss
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-5 text-[10px] border-amber-200 bg-white hover:bg-amber-50 text-amber-700 px-2"
                                        onClick={() => {
                                            setDeadline(new Date(aiSuggestions.deadline!.suggestedDeadline));
                                            setAiSuggestions(p => ({ ...p, deadline: null }));
                                        }}
                                    >
                                        Apply
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className={cn(errors.deadline && "rounded-md border border-red-500")}>
                        <DatePickerWithPresets
                            date={deadline}
                            setDate={(d) => {
                                setDeadline(d);
                                if (errors.deadline) setErrors(prev => ({ ...prev, deadline: "" }));
                            }}
                        />
                    </div>
                    {errors.deadline && <p className="text-[10px] text-red-500">{errors.deadline}</p>}
                </div>
            </div>

            {/* Assignees + AI Suggestion */}
            <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold">Assignees</Label>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50 px-2"
                        onClick={async () => {
                            if (!title) return toast.error("Please enter a title first");
                            setAiLoading("assignee");
                            const res = await suggestAssignee(title, description);
                            setAiLoading(null);
                            if (res.success) setAiSuggestions(p => ({ ...p, assignee: res.data || null }));
                            else toast.error(res.error);
                        }}
                        disabled={!!aiLoading || !title}
                    >
                        {aiLoading === "assignee" ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1 h-3 w-3" />}
                        Suggest Assignee
                    </Button>
                </div>

                {/* AI Assignee Suggestion */}
                {aiSuggestions.assignee && (
                    <div className="rounded-md border border-purple-200 bg-purple-50/50 p-3 text-sm mb-2">
                        <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-purple-900 flex items-center gap-2 text-xs">
                                <Sparkles className="h-4 w-4 text-purple-600" />
                                Suggested: {aiSuggestions.assignee.memberName}
                            </span>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-5 text-[10px] px-2"
                                    onClick={() => setAiSuggestions(p => ({ ...p, assignee: null }))}
                                >
                                    Dismiss
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-5 text-[10px] border-purple-200 bg-white hover:bg-purple-50 text-purple-700 px-2"
                                    onClick={() => {
                                        setAssigneeIds([aiSuggestions.assignee!.suggestedMemberId]);
                                        setAiSuggestions(p => ({ ...p, assignee: null }));
                                    }}
                                >
                                    Apply
                                </Button>
                            </div>
                        </div>
                        <p className="text-purple-800 text-xs italic">{aiSuggestions.assignee.reasoning}</p>
                    </div>
                )}

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
                                    <CommandItem
                                        onSelect={() => {
                                            if (assigneeIds.length === users.length) {
                                                setAssigneeIds([]);
                                            } else {
                                                setAssigneeIds(users.map((u: any) => u.id));
                                            }
                                        }}
                                        className="font-medium text-primary cursor-pointer"
                                    >
                                        <div
                                            className={cn(
                                                "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                                assigneeIds.length === users.length
                                                    ? "bg-primary text-primary-foreground"
                                                    : "opacity-50 [&_svg]:invisible"
                                            )}
                                        >
                                            <Check className="h-4 w-4" />
                                        </div>
                                        Select All Members
                                    </CommandItem>
                                    {users.map((u: any) => {
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
                                                        {getInitials(u.name)}
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
                            const u = users.find((u: any) => u.id === id);
                            return (
                                <Avatar key={id} className="h-6 w-6 border-2 border-background">
                                    <AvatarImage src={u?.image} />
                                    <AvatarFallback className="text-[8px] bg-muted font-bold">
                                        {getInitials(u?.name)}
                                    </AvatarFallback>
                                </Avatar>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
                    Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? "Creating..." : boardId ? "Add to Board" : "Create Task"}
                </Button>
            </div>

            <AITaskDialog
                open={isAIDraftOpen}
                onOpenChange={setIsAIDraftOpen}
                onTaskGenerated={handleAITaskGenerated}
            />
        </div>
    );
}
