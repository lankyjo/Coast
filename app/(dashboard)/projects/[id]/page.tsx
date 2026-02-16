"use client";

import { useEffect, useState, use } from "react";
import { useProjectStore } from "@/stores/project.store";
import { useTaskStore } from "@/stores/task.store";
import { useAuthStore } from "@/stores/auth.store";
import { toast } from "sonner";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    LayoutGrid,
    List,
    Plus,
    ArrowLeft,
    Calendar,
    CheckCircle2,
    Circle,
    Clock,
    Eye,
    Sparkles,
    Loader2,
} from "lucide-react";
import Link from "next/link";
import { TASK_STATUS_LABELS, TASK_STATUS_ORDER, TaskStatus } from "@/constants/task-status";
import { ITask } from "@/models/task.model";
import { TaskDetailModal } from "@/components/tasks/TaskDetailModal";
import { AITaskDialog } from "@/components/tasks/AITaskDialog";
import { ProjectActions } from "@/components/projects/ProjectActions";
import { useUserStore } from "@/stores/user.store";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
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
import { suggestAssignee, breakDownTask, suggestDeadline } from "@/actions/ai.actions";
import { AISuggestion, AITaskBreakdown, AIDeadlineSuggestion } from "@/types/ai.types";

const STATUS_ICONS: Record<string, React.ElementType> = {
    todo: Circle,
    in_progress: Clock,
    in_review: Eye,
    done: CheckCircle2,
};

const STATUS_COLORS: Record<string, string> = {
    todo: "border-t-slate-400",
    in_progress: "border-t-blue-500",
    in_review: "border-t-amber-500",
    done: "border-t-green-500",
};

export default function ProjectDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const { user } = useAuthStore();
    const { users, fetchUsers } = useUserStore();
    const { currentProject, fetchProjectById, isLoading: projectLoading } = useProjectStore();
    const { tasks, fetchTasks, createTask, viewMode, setViewMode, isLoading: tasksLoading } = useTaskStore();
    const [mounted, setMounted] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newTask, setNewTask] = useState({
        title: "",
        description: "",
        priority: "medium" as const,
        deadline: "",
        assigneeIds: [] as string[],
    });
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const [isAIOpen, setIsAIOpen] = useState(false);

    // AI State
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

    useEffect(() => {
        setMounted(true);
        fetchProjectById(id);
        fetchTasks({ project: id });
        fetchUsers();
    }, [id, fetchProjectById, fetchTasks, fetchUsers]);

    if (!mounted) return null;

    const isLoading = projectLoading || tasksLoading;

    // Group tasks by status for Kanban view
    const tasksByStatus: Record<string, ITask[]> = {};
    TASK_STATUS_ORDER.forEach((status) => {
        tasksByStatus[status] = tasks.filter((t) => t.status === status);
    });

    const handleCreateTask = async () => {
        if (!newTask.title) return;

        try {
            const result = await createTask({
                title: newTask.title,
                description: newTask.description,
                projectId: id,
                priority: newTask.priority,
                deadline: newTask.deadline || undefined,
                assigneeIds: newTask.assigneeIds,
            });

            if (result.success) {
                toast.success("Task created successfully");
                setNewTask({ title: "", description: "", priority: "medium", deadline: "", assigneeIds: [] });
                setIsCreateOpen(false);
            } else {
                toast.error(result.error || "Failed to create task");
            }
        } catch (err) {
            toast.error("An error occurred while creating the task");
        }
    };

    const handleOpenDetail = (taskId: string | null) => {
        setSelectedTaskId(taskId);
    };

    const selectedTask = tasks.find(t => t._id.toString() === selectedTaskId) || null;

    const handleTaskGenerated = (taskData: any) => {
        setNewTask({
            title: taskData.title,
            description: taskData.description,
            priority: taskData.priority,
            deadline: taskData.deadline || "",
            assigneeIds: [],
        });
        setIsCreateOpen(true);
    };

    return (
        <div className="space-y-6">
            {/* Back + Project Header */}
            <div>
                <Button variant="ghost" size="sm" asChild className="mb-2">
                    <Link href="/projects">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Projects
                    </Link>
                </Button>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        {isLoading && !currentProject ? (
                            <>
                                <Skeleton className="mb-2 h-8 w-64" />
                                <Skeleton className="h-4 w-96" />
                            </>
                        ) : (
                            <>
                                <h1 className="text-3xl font-bold tracking-tight">
                                    {currentProject?.name || "Project"}
                                </h1>
                                <p className="text-muted-foreground">
                                    {currentProject?.description || "No description"}
                                </p>
                            </>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center rounded-lg border p-1">
                            <Button
                                variant={viewMode === "kanban" ? "default" : "ghost"}
                                size="sm"
                                onClick={() => setViewMode("kanban")}
                            >
                                <LayoutGrid className="mr-1 h-4 w-4" /> Kanban
                            </Button>
                            <Button
                                variant={viewMode === "list" ? "default" : "ghost"}
                                size="sm"
                                onClick={() => setViewMode("list")}
                            >
                                <List className="mr-1 h-4 w-4" /> List
                            </Button>
                        </div>

                        {user?.role === "admin" && (
                            <>
                                <Button variant="outline" onClick={() => setIsAIOpen(true)}>
                                    <Sparkles className="mr-2 h-4 w-4" />
                                    AI Draft
                                </Button>

                                {/* Create Task */}
                                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                                    <DialogTrigger asChild>
                                        <Button>
                                            <Plus className="mr-2 h-4 w-4" /> Add Task
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                                        <DialogHeader>
                                            <DialogTitle>Create New Task</DialogTitle>
                                            <DialogDescription>
                                                Add a task to {currentProject?.name || "this project"}.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="grid gap-4 py-4">
                                            {/* Title */}
                                            <div className="grid gap-2">
                                                <Label htmlFor="task-title">Title</Label>
                                                <Input
                                                    id="task-title"
                                                    placeholder="Task title..."
                                                    value={newTask.title}
                                                    onChange={(e) => setNewTask((p) => ({ ...p, title: e.target.value }))}
                                                />
                                            </div>

                                            {/* Description + AI Buttons */}
                                            <div className="grid gap-2">
                                                <div className="flex items-center justify-between">
                                                    <Label htmlFor="task-desc">Description</Label>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="xs"
                                                            className="h-6 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                            onClick={async () => {
                                                                if (!newTask.title) return toast.error("Please enter a title first");
                                                                setAiLoading("breakdown");
                                                                const res = await breakDownTask(newTask.title, newTask.description);
                                                                setAiLoading(null);
                                                                if (res.success) setAiSuggestions(p => ({ ...p, breakdown: res.data || null }));
                                                                else toast.error(res.error);
                                                            }}
                                                            disabled={!!aiLoading || !newTask.title}
                                                        >
                                                            {aiLoading === "breakdown" ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1 h-3 w-3" />}
                                                            Break Down
                                                        </Button>
                                                    </div>
                                                </div>
                                                <Input
                                                    id="task-desc"
                                                    placeholder="Description..."
                                                    value={newTask.description}
                                                    onChange={(e) => setNewTask((p) => ({ ...p, description: e.target.value }))}
                                                />
                                            </div>

                                            {/* AI Breakdown Suggestion Card */}
                                            {aiSuggestions.breakdown && (
                                                <div className="rounded-md border border-blue-200 bg-blue-50/50 p-3 text-sm">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="font-medium text-blue-900 flex items-center gap-2">
                                                            <Sparkles className="h-4 w-4 text-blue-600" />
                                                            AI Suggestion: Break Down
                                                        </span>
                                                        <div className="flex gap-2">
                                                            <Button
                                                                size="xs"
                                                                variant="ghost"
                                                                className="h-6 text-xs"
                                                                onClick={() => setAiSuggestions(p => ({ ...p, breakdown: null }))}
                                                            >
                                                                Dismiss
                                                            </Button>
                                                            <Button
                                                                size="xs"
                                                                variant="outline"
                                                                className="h-6 text-xs border-blue-200 bg-white hover:bg-blue-50 text-blue-700"
                                                                onClick={() => {
                                                                    const text = aiSuggestions.breakdown?.subtasks
                                                                        .map((s: any) => `- ${s.title} (${s.estimatedMinutes}m)`).join("\n");
                                                                    setNewTask(p => ({
                                                                        ...p,
                                                                        description: p.description ? `${p.description}\n\nSubtasks:\n${text}` : `Subtasks:\n${text}`
                                                                    }));
                                                                    setAiSuggestions(p => ({ ...p, breakdown: null }));
                                                                }}
                                                            >
                                                                Append to Description
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    <ul className="list-disc list-inside space-y-1 text-slate-700">
                                                        {aiSuggestions.breakdown?.subtasks.map((s: any, i: number) => (
                                                            <li key={i}>{s.title} <span className="text-slate-500 text-xs">({s.estimatedMinutes}m)</span></li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {/* Assignee + AI Button */}
                                            <div className="grid gap-2">
                                                <div className="flex items-center justify-between">
                                                    <Label>Assign To</Label>
                                                    <Button
                                                        variant="ghost"
                                                        size="xs"
                                                        className="h-6 text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                                                        onClick={async () => {
                                                            if (!newTask.title) return toast.error("Please enter a title first");
                                                            setAiLoading("assignee");
                                                            const res = await suggestAssignee(newTask.title, newTask.description);
                                                            setAiLoading(null);
                                                            if (res.success) setAiSuggestions(p => ({ ...p, assignee: res.data || null }));
                                                            else toast.error(res.error);
                                                        }}
                                                        disabled={!!aiLoading || !newTask.title}
                                                    >
                                                        {aiLoading === "assignee" ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1 h-3 w-3" />}
                                                        Suggest Assignee
                                                    </Button>
                                                </div>

                                                {/* AI Assignee Suggestion Card */}
                                                {aiSuggestions.assignee && (
                                                    <div className="rounded-md border border-purple-200 bg-purple-50/50 p-3 text-sm mb-2">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="font-medium text-purple-900 flex items-center gap-2">
                                                                <Sparkles className="h-4 w-4 text-purple-600" />
                                                                Suggested: {aiSuggestions.assignee.memberName}
                                                            </span>
                                                            <div className="flex gap-2">
                                                                <Button
                                                                    size="xs"
                                                                    variant="ghost"
                                                                    className="h-6 text-xs"
                                                                    onClick={() => setAiSuggestions(p => ({ ...p, assignee: null }))}
                                                                >
                                                                    Dismiss
                                                                </Button>
                                                                <Button
                                                                    size="xs"
                                                                    variant="outline"
                                                                    className="h-6 text-xs border-purple-200 bg-white hover:bg-purple-50 text-purple-700"
                                                                    onClick={() => {
                                                                        setNewTask(p => ({ ...p, assigneeIds: [aiSuggestions.assignee?.suggestedMemberId || ""] }));
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
                                                            role="combobox"
                                                            className="justify-between"
                                                        >
                                                            {newTask.assigneeIds.length > 0
                                                                ? `${newTask.assigneeIds.length} users selected`
                                                                : "Select users..."}
                                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-[300px] p-0">
                                                        <Command>
                                                            <CommandInput placeholder="Search users..." />
                                                            <CommandList>
                                                                <CommandEmpty>No users found.</CommandEmpty>
                                                                <CommandGroup>
                                                                    {users.map((u) => (
                                                                        <CommandItem
                                                                            key={u.id}
                                                                            onSelect={() => {
                                                                                setNewTask(p => ({
                                                                                    ...p,
                                                                                    assigneeIds: p.assigneeIds.includes(u.id)
                                                                                        ? p.assigneeIds.filter(id => id !== u.id)
                                                                                        : [...p.assigneeIds, u.id]
                                                                                }));
                                                                            }}
                                                                        >
                                                                            <div className={cn(
                                                                                "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                                                                newTask.assigneeIds.includes(u.id)
                                                                                    ? "bg-primary text-primary-foreground"
                                                                                    : "opacity-50 [&_svg]:invisible"
                                                                            )}>
                                                                                <Check className={cn("h-4 w-4")} />
                                                                            </div>
                                                                            <span>{u.name}</span>
                                                                        </CommandItem>
                                                                    ))}
                                                                </CommandGroup>
                                                            </CommandList>
                                                        </Command>
                                                    </PopoverContent>
                                                </Popover>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="task-priority">Priority</Label>
                                                    <select
                                                        id="task-priority"
                                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                                                        value={newTask.priority}
                                                        onChange={(e) => setNewTask((p) => ({ ...p, priority: e.target.value as any }))}
                                                    >
                                                        <option value="low">Low</option>
                                                        <option value="medium">Medium</option>
                                                        <option value="high">High</option>
                                                        <option value="urgent">Urgent</option>
                                                    </select>
                                                </div>
                                                <div className="grid gap-2">
                                                    <div className="flex items-center justify-between">
                                                        <Label htmlFor="task-deadline">Deadline</Label>
                                                        <Button
                                                            variant="ghost"
                                                            size="xs"
                                                            className="h-6 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                                            onClick={async () => {
                                                                if (!newTask.title) return toast.error("Please enter a title first");
                                                                setAiLoading("deadline");
                                                                const res = await suggestDeadline(newTask.title, newTask.description, newTask.priority);
                                                                setAiLoading(null);
                                                                if (res.success) setAiSuggestions(p => ({ ...p, deadline: res.data || null }));
                                                                else toast.error(res.error);
                                                            }}
                                                            disabled={!!aiLoading || !newTask.title}
                                                        >
                                                            {aiLoading === "deadline" ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1 h-3 w-3" />}
                                                            Suggest
                                                        </Button>
                                                    </div>

                                                    {/* AI Deadline Suggestion Card */}
                                                    {aiSuggestions.deadline && (
                                                        <div className="rounded-md border border-amber-200 bg-amber-50/50 p-2 text-sm mb-1">
                                                            <div className="flex items-center justify-between">
                                                                <span className="font-medium text-amber-900 flex items-center gap-2 text-xs">
                                                                    <Sparkles className="h-3 w-3 text-amber-600" />
                                                                    {new Date(aiSuggestions.deadline.suggestedDeadline).toLocaleDateString()}
                                                                </span>
                                                                <Button
                                                                    size="xs"
                                                                    variant="outline"
                                                                    className="h-5 text-[10px] border-amber-200 bg-white hover:bg-amber-50 text-amber-700 px-2"
                                                                    onClick={() => {
                                                                        setNewTask(p => ({ ...p, deadline: aiSuggestions.deadline?.suggestedDeadline.split("T")[0] || "" }));
                                                                        setAiSuggestions(p => ({ ...p, deadline: null }));
                                                                    }}
                                                                >
                                                                    Apply
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <Input
                                                        id="task-deadline"
                                                        type="date"
                                                        value={newTask.deadline}
                                                        onChange={(e) => setNewTask((p) => ({ ...p, deadline: e.target.value }))}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                                            <Button onClick={handleCreateTask} disabled={!newTask.title}>Create Task</Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                                {currentProject && <ProjectActions project={currentProject} />}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="grid gap-4 md:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="space-y-3">
                            <Skeleton className="h-8 w-full" />
                            <Skeleton className="h-24 w-full" />
                            <Skeleton className="h-24 w-full" />
                        </div>
                    ))}
                </div>
            ) : viewMode === "kanban" ? (
                /* ========= KANBAN VIEW ========= */
                <div className="grid gap-4 md:grid-cols-4">
                    {TASK_STATUS_ORDER.map((status) => {
                        const statusTasks = tasksByStatus[status] || [];
                        const StatusIcon = STATUS_ICONS[status] || Circle;
                        return (
                            <div key={status} className="space-y-3">
                                {/* Column Header */}
                                <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2">
                                    <div className="flex items-center gap-2 text-sm font-medium">
                                        <StatusIcon className="h-4 w-4" />
                                        {TASK_STATUS_LABELS[status]}
                                    </div>
                                    <Badge variant="secondary" className="text-xs">
                                        {statusTasks.length}
                                    </Badge>
                                </div>

                                {/* Task Cards */}
                                <div className="space-y-2">
                                    {statusTasks.length === 0 ? (
                                        <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                                            No tasks
                                        </div>
                                    ) : (
                                        statusTasks.map((task) => (
                                            <Card
                                                key={task._id?.toString()}
                                                className={`border-t-2 ${STATUS_COLORS[status]} cursor-pointer transition-all hover:shadow-sm`}
                                                onClick={() => handleOpenDetail(task._id.toString())}
                                            >
                                                <CardContent className="p-3">
                                                    <p className="text-sm font-medium">{task.title}</p>
                                                    <div className="mt-2 flex items-center justify-between">
                                                        <div className="flex -space-x-2 overflow-hidden">
                                                            {task.assigneeIds?.slice(0, 3).map((id, i) => {
                                                                const user = users.find(u => u.id === id.toString());
                                                                return (
                                                                    <div
                                                                        key={id.toString()}
                                                                        className="h-6 w-6 rounded-full ring-2 ring-background bg-muted flex items-center justify-center text-[10px] font-bold"
                                                                        title={user?.name || "User"}
                                                                    >
                                                                        {user?.name?.charAt(0) || "?"}
                                                                    </div>
                                                                );
                                                            })}
                                                            {(task.assigneeIds?.length || 0) > 3 && (
                                                                <div className="h-6 w-6 rounded-full ring-2 ring-background bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                                                                    +{(task.assigneeIds?.length || 0) - 3}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <Badge
                                                            variant={
                                                                task.priority === "urgent"
                                                                    ? "destructive"
                                                                    : task.priority === "high"
                                                                        ? "default"
                                                                        : "outline"
                                                            }
                                                            className="text-[10px]"
                                                        >
                                                            {task.priority}
                                                        </Badge>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* ========= LIST VIEW ========= */
                <Card>
                    <CardHeader>
                        <CardTitle>All Tasks</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {tasks.length === 0 ? (
                            <p className="py-8 text-center text-sm text-muted-foreground">
                                No tasks yet. Add your first task to get started.
                            </p>
                        ) : (
                            <div className="space-y-1">
                                {tasks.map((task) => {
                                    const StatusIcon = STATUS_ICONS[task.status] || Circle;
                                    return (
                                        <div
                                            key={task._id?.toString()}
                                            className="flex items-center justify-between rounded-md px-3 py-2.5 transition-colors hover:bg-muted/50 cursor-pointer"
                                            onClick={() => handleOpenDetail(task._id.toString())}
                                        >
                                            <div className="flex items-center gap-3">
                                                <StatusIcon className="h-4 w-4 text-muted-foreground" />
                                                <div>
                                                    <p className="text-sm font-medium">{task.title}</p>
                                                    <p className="text-xs text-muted-foreground capitalize">
                                                        {TASK_STATUS_LABELS[task.status as TaskStatus]}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex -space-x-2 overflow-hidden">
                                                    {task.assigneeIds?.slice(0, 3).map((id, i) => {
                                                        const user = users.find(u => u.id === id.toString());
                                                        return (
                                                            <div
                                                                key={id.toString()}
                                                                className="h-6 w-6 rounded-full ring-2 ring-background bg-muted flex items-center justify-center text-[10px] font-bold"
                                                                title={user?.name || "User"}
                                                            >
                                                                {user?.name?.charAt(0) || "?"}
                                                            </div>
                                                        );
                                                    })}
                                                    {(task.assigneeIds?.length || 0) > 3 && (
                                                        <div className="h-6 w-6 rounded-full ring-2 ring-background bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                                                            +{(task.assigneeIds?.length || 0) - 3}
                                                        </div>
                                                    )}
                                                </div>
                                                <Badge
                                                    variant={
                                                        task.priority === "urgent"
                                                            ? "destructive"
                                                            : task.priority === "high"
                                                                ? "default"
                                                                : "outline"
                                                    }
                                                    className="text-xs"
                                                >
                                                    {task.priority}
                                                </Badge>
                                                {task.deadline && (
                                                    <span className="text-xs text-muted-foreground">
                                                        {new Date(task.deadline).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            <TaskDetailModal
                key={selectedTask?._id?.toString() || "task-detail-modal"}
                task={selectedTask}
                open={!!selectedTaskId}
                onOpenChange={(open) => !open && handleOpenDetail(null)}
            />

            <AITaskDialog
                open={isAIOpen}
                onOpenChange={setIsAIOpen}
                onTaskGenerated={handleTaskGenerated}
            />
        </div>
    );
}
