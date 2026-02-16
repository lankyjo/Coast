"use client";

import { useState } from "react";
import { ITask } from "@/models/task.model";
import { useTaskStore } from "@/stores/task.store";
import { useAuthStore } from "@/stores/auth.store";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
    Calendar,
    CheckCircle2,
    Circle,
    Clock,
    Eye,
    Plus,
    Trash2,
    AlertTriangle,
} from "lucide-react";
import { TASK_STATUS_LABELS, TASK_STATUS_ORDER, TaskStatus } from "@/constants/task-status";
import { PRIORITY_LABELS, PRIORITY_ORDER, Priority } from "@/constants/priority";

import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

interface TaskDetailModalProps {
    task: ITask | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const STATUS_ICONS: Record<string, React.ElementType> = {
    todo: Circle,
    in_progress: Clock,
    in_review: Eye,
    done: CheckCircle2,
};

const PRIORITY_BADGE_VARIANT: Record<string, "destructive" | "default" | "secondary" | "outline"> = {
    urgent: "destructive",
    high: "default",
    medium: "secondary",
    low: "outline",
};

export function TaskDetailModal({ task, open, onOpenChange }: TaskDetailModalProps) {
    const { user } = useAuthStore();
    const { users } = useUserStore();
    const { updateTask, deleteTask, addSubtask, toggleSubtask } = useTaskStore();
    const [newSubtask, setNewSubtask] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);

    if (!task) return null;

    const isAdmin = user?.role === "admin";
    const isAssignee = task.assigneeIds?.some(id => id.toString() === user?.id);
    const canUpdateStatus = isAdmin || isAssignee;
    const canManageSubtasks = isAdmin || isAssignee;
    const canDelete = isAdmin;
    const canUpdatePriority = isAdmin;
    const canManageAssignees = isAdmin;

    const handleStatusChange = async (status: TaskStatus) => {
        if (!canUpdateStatus) return;
        await updateTask(task._id.toString(), { status });
    };

    const handlePriorityChange = async (priority: Priority) => {
        if (!canUpdatePriority) return;
        await updateTask(task._id.toString(), { priority });
    };

    const handleAddSubtask = async () => {
        if (!canManageSubtasks || !newSubtask.trim()) return;
        await addSubtask(task._id.toString(), newSubtask.trim());
        setNewSubtask("");
    };

    const handleToggleSubtask = async (subtaskId: string, done: boolean) => {
        if (!canManageSubtasks) return;
        await toggleSubtask(task._id.toString(), subtaskId, done);
    };

    const handleDelete = async () => {
        if (!canDelete) return;
        setIsDeleting(true);
        const success = await deleteTask(task._id.toString());
        if (success) {
            setShowDeleteAlert(false);
            onOpenChange(false);
        }
        setIsDeleting(false);
    };

    const subtaskProgress = task.subtasks?.length
        ? Math.round((task.subtasks.filter((s) => s.done).length / task.subtasks.length) * 100)
        : 0;

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold pr-8">{task.title}</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6 pt-2">
                        {/* Description */}
                        {task.description && (
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {task.description}
                            </p>
                        )}

                        {/* Status + Priority Row */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Status */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    Status
                                </label>
                                <div className="flex flex-wrap gap-1.5">
                                    {TASK_STATUS_ORDER.map((s) => {
                                        const Icon = STATUS_ICONS[s] || Circle;
                                        const isActive = task.status === s;
                                        return (
                                            <Button
                                                key={s}
                                                variant={isActive ? "default" : "outline"}
                                                size="sm"
                                                className="text-xs h-7 px-2"
                                                onClick={() => handleStatusChange(s)}
                                                disabled={!canUpdateStatus && !isActive}
                                            >
                                                <Icon className="mr-1 h-3 w-3" />
                                                {TASK_STATUS_LABELS[s]}
                                            </Button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Priority */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    Priority
                                </label>
                                <div className="flex flex-wrap gap-1.5">
                                    {PRIORITY_ORDER.map((p) => {
                                        const isActive = task.priority === p;
                                        return (
                                            <Button
                                                key={p}
                                                variant={isActive ? PRIORITY_BADGE_VARIANT[p] : "outline"}
                                                size="sm"
                                                className="text-xs h-7 px-2"
                                                onClick={() => handlePriorityChange(p)}
                                                disabled={!canUpdatePriority && !isActive}
                                            >
                                                {PRIORITY_LABELS[p]}
                                            </Button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Metadata Row */}
                        <div className="flex flex-col gap-4">
                            {/* Assignees */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    Assignees
                                </label>
                                <div className="flex flex-wrap items-center gap-2">
                                    <div className="flex -space-x-2">
                                        {(task.assigneeIds || []).map((id) => {
                                            const u = users.find((u: any) => u.id === id.toString());
                                            return (
                                                <Avatar key={id.toString()} className="h-8 w-8 border-2 border-background ring-1 ring-border">
                                                    <AvatarImage src={u?.image} />
                                                    <AvatarFallback className="text-[10px] bg-muted font-bold">
                                                        {u?.name?.charAt(0) || "?"}
                                                    </AvatarFallback>
                                                </Avatar>
                                            );
                                        })}
                                    </div>

                                    {canManageAssignees && (
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" size="sm" className="h-8 gap-1 rounded-full px-3">
                                                    <Plus className="h-3.5 w-3.5" />
                                                    Manage
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[200px] p-0" align="start">
                                                <Command>
                                                    <CommandInput placeholder="Search users..." />
                                                    <CommandList>
                                                        <CommandEmpty>No users found.</CommandEmpty>
                                                        <CommandGroup>
                                                            {users.map((u) => {
                                                                const isAssigned = (task.assigneeIds || []).some(id => id.toString() === u.id);
                                                                return (
                                                                    <CommandItem
                                                                        key={u.id}
                                                                        onSelect={async () => {
                                                                            const currentIds = task.assigneeIds || [];
                                                                            const newIds = isAssigned
                                                                                ? currentIds.filter(id => id.toString() !== u.id)
                                                                                : [...currentIds, u.id];
                                                                            await updateTask(task._id.toString(), { assigneeIds: newIds as any });
                                                                        }}
                                                                    >
                                                                        <div className={cn(
                                                                            "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                                                            isAssigned
                                                                                ? "bg-primary text-primary-foreground"
                                                                                : "opacity-50 [&_svg]:invisible"
                                                                        )}>
                                                                            <Check className="h-4 w-4" />
                                                                        </div>
                                                                        <span className="truncate">{u.name}</span>
                                                                    </CommandItem>
                                                                );
                                                            })}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                {task.deadline && (
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="h-3.5 w-3.5" />
                                        <span>
                                            Due {new Date(task.deadline).toLocaleDateString("en-US", {
                                                month: "short",
                                                day: "numeric",
                                                year: "numeric",
                                            })}
                                        </span>
                                    </div>
                                )}
                                {task.createdAt && (
                                    <div className="flex items-center gap-1.5">
                                        <Clock className="h-3.5 w-3.5" />
                                        <span>
                                            Created {new Date(task.createdAt).toLocaleDateString("en-US", {
                                                month: "short",
                                                day: "numeric",
                                                year: "numeric",
                                            })}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <Separator />

                        {/* Subtasks */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    Subtasks
                                </label>
                                {task.subtasks?.length > 0 && (
                                    <span className="text-xs text-muted-foreground">
                                        {subtaskProgress}% complete
                                    </span>
                                )}
                            </div>

                            {/* Subtask Progress Bar */}
                            {task.subtasks?.length > 0 && (
                                <div className="h-1.5 w-full rounded-full bg-muted">
                                    <div
                                        className="h-1.5 rounded-full bg-primary transition-all"
                                        style={{ width: `${subtaskProgress}%` }}
                                    />
                                </div>
                            )}

                            {/* Subtask List */}
                            <div className="space-y-1">
                                {task.subtasks?.map((subtask) => (
                                    <div
                                        key={subtask._id.toString()}
                                        className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50 transition-colors"
                                    >
                                        <button
                                            onClick={() => handleToggleSubtask(subtask._id.toString(), !subtask.done)}
                                            className="shrink-0 disabled:cursor-not-allowed"
                                            disabled={!canManageSubtasks}
                                        >
                                            {subtask.done ? (
                                                <CheckCircle2 className="h-4 w-4 text-primary" />
                                            ) : (
                                                <Circle className="h-4 w-4 text-muted-foreground" />
                                            )}
                                        </button>
                                        <span
                                            className={`text-sm ${subtask.done ? "line-through text-muted-foreground" : ""
                                                }`}
                                        >
                                            {subtask.title}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Add Subtask */}
                            {canManageSubtasks && (
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Add a subtask..."
                                        value={newSubtask}
                                        onChange={(e) => setNewSubtask(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleAddSubtask()}
                                        className="h-8 text-sm"
                                    />
                                    <Button size="sm" variant="outline" className="h-8 shrink-0" onClick={handleAddSubtask} disabled={!newSubtask.trim()}>
                                        <Plus className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            )}
                        </div>

                        {canDelete && (
                            <>
                                <Separator />

                                {/* Danger Zone */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <AlertTriangle className="h-4 w-4" />
                                        <span>Delete this task permanently</span>
                                    </div>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => setShowDeleteAlert(true)}
                                        disabled={isDeleting}
                                    >
                                        <Trash2 className="mr-1 h-3.5 w-3.5" />
                                        {isDeleting ? "Deleting..." : "Delete"}
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the task
                            and remove it from our servers.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            {isDeleting ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
