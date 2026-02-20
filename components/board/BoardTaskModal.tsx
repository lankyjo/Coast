"use client";

import { useState, useEffect, useRef } from "react";
import { ITask } from "@/models/task.model";
import { useAuthStore } from "@/stores/auth.store";
import { useUserStore } from "@/stores/user.store";
import { useProjectStore } from "@/stores/project.store";
import { useBoardStore } from "@/stores/board.store";
import { useTaskStore } from "@/stores/task.store";
import { Comment } from "@/types/board.types";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import {
    CheckCircle2,
    Circle,
    Clock,
    Eye,
    Send,
    MessageSquare,
    Users,
    FolderKanban,
    Flag,
    Pencil,
    Check,
    ChevronsUpDown,
    X,
    Trash2,
    Calendar as CalendarIcon,
} from "lucide-react";
import { DatePickerWithPresets } from "@/components/ui/date-picker-with-presets";
import { TASK_STATUS_LABELS, TASK_STATUS_ORDER, TaskStatus } from "@/constants/task-status";
import { PRIORITY_LABELS, PRIORITY_ORDER, Priority } from "@/constants/priority";
import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/user-utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface BoardTaskModalProps {
    taskId: string | null;
    boardId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const STATUS_ICONS: Record<string, React.ElementType> = {
    todo: Circle,
    in_progress: Clock,
    in_review: Eye,
    done: CheckCircle2,
};

const PRIORITY_COLORS: Record<string, string> = {
    urgent: "text-red-400",
    high: "text-orange-400",
    medium: "text-blue-400",
    low: "text-slate-400",
};

export function BoardTaskModal({ taskId, boardId, open, onOpenChange }: BoardTaskModalProps) {
    const { user } = useAuthStore();
    const { users } = useUserStore();
    const { projects } = useProjectStore();
    const { updateTask } = useTaskStore();
    const { toggleTaskDone, fetchComments, addComment, comments, isLoadingComments, fetchBoardTasks, boardTasks, deleteBoardTask } = useBoardStore();

    // Derive task from store for reactivity
    const task = taskId && boardTasks[boardId] ? boardTasks[boardId].find((t) => t._id.toString() === taskId) : null;

    const [commentText, setCommentText] = useState("");
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editTitle, setEditTitle] = useState("");
    const [isEditingDesc, setIsEditingDesc] = useState(false);
    const [editDesc, setEditDesc] = useState("");

    // @mention state
    const [showMentions, setShowMentions] = useState(false);
    const [mentionQuery, setMentionQuery] = useState("");
    const [mentionStartIndex, setMentionStartIndex] = useState(-1);
    const commentInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (taskId && open) {
            fetchComments(taskId);
        }
    }, [taskId, open, fetchComments]);

    // Close if task is deleted or not found
    useEffect(() => {
        if (open && taskId && !task) {
            onOpenChange(false);
        }
    }, [task, open, taskId, onOpenChange]);

    if (!task) return null;

    const isAdmin = user?.role === "admin";
    const isAssignee = task.assigneeIds?.some(
        (id: any) => id.toString() === user?.id
    );
    const canToggleDone = isAdmin || isAssignee;
    const canUpdateStatus = isAdmin || isAssignee;
    const canUpdatePriority = isAdmin;
    const canEditDetails = isAdmin;
    const canManageAssignees = isAdmin;
    const isDone = task.status === "done";

    const project = projects.find(
        (p: any) => p._id?.toString() === task.projectId?.toString()
    );

    const handleToggle = async () => {
        if (!canToggleDone) return;
        await toggleTaskDone(task._id.toString(), boardId);
        // Store update triggers re-render automatically
    };

    const handleStatusChange = async (status: TaskStatus) => {
        if (!canUpdateStatus) return;
        await updateTask(task._id.toString(), { status });
        await fetchBoardTasks(boardId);
    };

    const handlePriorityChange = async (priority: Priority) => {
        if (!canUpdatePriority) return;
        await updateTask(task._id.toString(), { priority });
        await fetchBoardTasks(boardId);
    };

    const handleSaveTitle = async () => {
        if (!canEditDetails || !editTitle.trim()) return;
        await updateTask(task._id.toString(), { title: editTitle.trim() });
        await fetchBoardTasks(boardId);
        setIsEditingTitle(false);
    };

    const handleSaveDesc = async () => {
        if (!canEditDetails) return;
        await updateTask(task._id.toString(), { description: editDesc.trim() });
        await fetchBoardTasks(boardId);
        setIsEditingDesc(false);
    };

    const handleAssigneeToggle = async (userId: string) => {
        if (!canManageAssignees) return;
        const currentIds = (task.assigneeIds || []).map((id: any) => id.toString());
        const newIds = currentIds.includes(userId)
            ? currentIds.filter((id: string) => id !== userId)
            : [...currentIds, userId];
        await updateTask(task._id.toString(), { assigneeIds: newIds as any });
        await fetchBoardTasks(boardId);
    };

    const handleProjectChange = async (projectId: string) => {
        if (!canEditDetails) return;
        await updateTask(task._id.toString(), { projectId } as any);
        await fetchBoardTasks(boardId);
    };

    const handleDeleteTask = async () => {
        if (!isAdmin) return;
        await deleteBoardTask(task._id.toString(), boardId);
        onOpenChange(false);
    };

    // @mention logic
    const filteredMentionUsers = (() => {
        if (!mentionQuery) return users.slice(0, 3);
        return users
            .filter((u) => u.name.toLowerCase().includes(mentionQuery.toLowerCase()))
            .slice(0, 5);
    })();

    const handleCommentChange = (value: string) => {
        setCommentText(value);

        const cursorPos = commentInputRef.current?.selectionStart || value.length;
        const textBeforeCursor = value.slice(0, cursorPos);
        const lastAtIndex = textBeforeCursor.lastIndexOf("@");

        if (lastAtIndex !== -1) {
            const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
            if (!textAfterAt.includes(" ")) {
                setShowMentions(true);
                setMentionQuery(textAfterAt);
                setMentionStartIndex(lastAtIndex);
                return;
            }
        }
        setShowMentions(false);
        setMentionQuery("");
    };

    const handleSelectMention = (userName: string) => {
        const before = commentText.slice(0, mentionStartIndex);
        const after = commentText.slice(
            mentionStartIndex + 1 + mentionQuery.length
        );
        const newText = `${before}@${userName} ${after}`;
        setCommentText(newText);
        setShowMentions(false);
        setMentionQuery("");
        commentInputRef.current?.focus();
    };

    const handleSendComment = async () => {
        if (!commentText.trim()) return;

        const mentionRegex = /@(\S+)/g;
        const mentions = [...commentText.matchAll(mentionRegex)];
        const taggedUserIds = mentions
            .map((m) => {
                const name = m[1];
                const found = users.find(
                    (u) => {
                        // try exact match or first name match
                        const uName = u.name.toLowerCase();
                        const qName = name.toLowerCase();
                        return uName === qName || uName.split(" ")[0] === qName;
                    }
                );
                return found?.id;
            })
            .filter(Boolean) as string[];

        // Only add comment and notify - assignment is handled via "Manage" button
        await addComment(task._id.toString(), commentText.trim(), taggedUserIds);
        setCommentText("");
        setShowMentions(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[750px] max-h-[85vh] p-0 overflow-hidden outline-none">
                <div className="flex flex-col sm:flex-row h-full max-h-[85vh]">
                    {/* Left column — Task Details */}
                    <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
                        <DialogHeader className="pb-2">
                            <div className="flex items-start gap-3">
                                <button
                                    onClick={handleToggle}
                                    disabled={!canToggleDone}
                                    className={cn(
                                        "mt-1 shrink-0 transition-colors",
                                        canToggleDone
                                            ? "hover:text-primary cursor-pointer"
                                            : "cursor-not-allowed opacity-50"
                                    )}
                                >
                                    {isDone ? (
                                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                    ) : (
                                        <Circle className="h-5 w-5 text-muted-foreground" />
                                    )}
                                </button>

                                {/* Editable title */}
                                {isEditingTitle ? (
                                    <div className="flex-1 flex items-center gap-2">
                                        <Input
                                            value={editTitle}
                                            onChange={(e) => setEditTitle(e.target.value)}
                                            onKeyDown={(e) => e.key === "Enter" && handleSaveTitle()}
                                            className="h-8 text-lg font-bold"
                                            autoFocus
                                        />
                                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={handleSaveTitle}>
                                            <Check className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setIsEditingTitle(false)}>
                                            <X className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 flex-1">
                                        <DialogTitle
                                            className={cn(
                                                "text-lg font-bold leading-snug",
                                                isDone && "line-through text-muted-foreground"
                                            )}
                                        >
                                            {task.title}
                                        </DialogTitle>
                                        {canEditDetails && (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity"
                                                onClick={() => {
                                                    setEditTitle(task.title);
                                                    setIsEditingTitle(true);
                                                }}
                                            >
                                                <Pencil className="h-3 w-3" />
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </DialogHeader>

                        <div className="space-y-5 pt-3">
                            {/* Editable description */}
                            <div className="space-y-2">
                                {isEditingDesc ? (
                                    <div className="space-y-2">
                                        <Textarea
                                            value={editDesc}
                                            onChange={(e) => setEditDesc(e.target.value)}
                                            rows={3}
                                            className="text-sm resize-none"
                                            autoFocus
                                        />
                                        <div className="flex gap-1.5">
                                            <Button size="sm" className="h-7 text-xs" onClick={handleSaveDesc}>
                                                Save
                                            </Button>
                                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setIsEditingDesc(false)}>
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div
                                        className={cn(
                                            "text-sm text-muted-foreground leading-relaxed min-h-[40px] border border-transparent",
                                            canEditDetails && "cursor-pointer hover:bg-muted/50 hover:border-border rounded-md p-2 -m-2 transition-all duration-200"
                                        )}
                                        onClick={() => {
                                            if (canEditDetails) {
                                                setEditDesc(task.description || "");
                                                setIsEditingDesc(true);
                                            }
                                        }}
                                    >
                                        {task.description || (
                                            <span className="italic text-muted-foreground/50">
                                                {canEditDetails ? "Click to add description..." : "No description"}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Status */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                    <Clock className="h-3 w-3" />
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
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                    <Flag className="h-3 w-3" />
                                    Priority
                                </label>
                                <div className="flex flex-wrap gap-1.5">
                                    {PRIORITY_ORDER.map((p) => {
                                        const isActive = task.priority === p;
                                        return (
                                            <Button
                                                key={p}
                                                variant={isActive ? "default" : "outline"}
                                                size="sm"
                                                className={cn(
                                                    "text-xs h-7 px-2",
                                                    isActive && PRIORITY_COLORS[p]
                                                )}
                                                onClick={() => handlePriorityChange(p)}
                                                disabled={!canUpdatePriority && !isActive}
                                            >
                                                {PRIORITY_LABELS[p]}
                                            </Button>
                                        );
                                    })}
                                </div>
                            </div>

                            <Separator />

                            <Separator />

                            <Separator />

                            {/* Dates (Start & Due) */}
                            <div className="grid grid-cols-2 gap-4">
                                {/* Start Date */}
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                        <CalendarIcon className="h-3 w-3" />
                                        Start Date
                                    </label>
                                    <div className={cn(!canEditDetails && "pointer-events-none opacity-80")}>
                                        <DatePickerWithPresets
                                            date={task.startDate ? new Date(task.startDate) : undefined}
                                            setDate={async (date) => {
                                                if (canEditDetails && date) {
                                                    await updateTask(task._id.toString(), { startDate: date.toISOString() });
                                                    await fetchBoardTasks(boardId);
                                                }
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Due Date */}
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                        <CalendarIcon className="h-3 w-3" />
                                        Due Date
                                    </label>
                                    <div className={cn(!canEditDetails && "pointer-events-none opacity-80")}>
                                        <DatePickerWithPresets
                                            date={task.deadline ? new Date(task.deadline) : undefined}
                                            setDate={async (date) => {
                                                if (canEditDetails && date) {
                                                    await updateTask(task._id.toString(), { deadline: date.toISOString() });
                                                    await fetchBoardTasks(boardId);
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Members */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                    <Users className="h-3 w-3" />
                                    Members
                                </label>
                                <div className="flex flex-wrap items-center gap-2">
                                    {(task.assigneeIds || []).map((id: any) => {
                                        const u = users.find(
                                            (u) => u.id === id.toString()
                                        );
                                        return (
                                            <div
                                                key={id.toString()}
                                                className="flex items-center gap-1.5 rounded-full bg-muted px-2 py-1"
                                            >
                                                <Avatar className="h-5 w-5">
                                                    <AvatarImage src={u?.image} />
                                                    <AvatarFallback className="text-[8px] font-bold">
                                                        {getInitials(u?.name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="text-xs font-medium">
                                                    {u?.name || "Unknown"}
                                                </span>
                                            </div>
                                        );
                                    })}

                                    {/* Manage Assignees (admin) */}
                                    {canManageAssignees && (
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" size="sm" className="h-7 gap-1 rounded-full px-2.5 text-xs">
                                                    <ChevronsUpDown className="h-3 w-3" />
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
                                                                const isAssigned = (task.assigneeIds || []).some(
                                                                    (id: any) => id.toString() === u.id
                                                                );
                                                                return (
                                                                    <CommandItem
                                                                        key={u.id}
                                                                        onSelect={() => handleAssigneeToggle(u.id)}
                                                                    >
                                                                        <div
                                                                            className={cn(
                                                                                "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                                                                isAssigned
                                                                                    ? "bg-primary text-primary-foreground"
                                                                                    : "opacity-50 [&_svg]:invisible"
                                                                            )}
                                                                        >
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

                                    {(!task.assigneeIds || task.assigneeIds.length === 0) && !canManageAssignees && (
                                        <span className="text-xs text-muted-foreground">No members assigned</span>
                                    )}
                                </div>
                            </div>

                            {/* Project (admin can change) */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                    <FolderKanban className="h-3 w-3" />
                                    Project
                                </label>
                                {canEditDetails ? (
                                    <Select
                                        value={task.projectId?.toString()}
                                        onValueChange={handleProjectChange}
                                    >
                                        <SelectTrigger className="h-8 w-[200px] text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {projects.map((p: any) => (
                                                <SelectItem key={p._id.toString()} value={p._id.toString()}>
                                                    {p.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                ) : project ? (
                                    <Badge variant="outline" className="text-xs">
                                        {project.name}
                                    </Badge>
                                ) : (
                                    <span className="text-xs text-muted-foreground">No project</span>
                                )}
                            </div>

                            {/* Visibility */}
                            {(task as any).visibility === "private" && (
                                <Badge variant="outline" className="text-xs text-amber-400 border-amber-500/30">
                                    Private Task
                                </Badge>
                            )}

                            {/* Delete Button (Admin only) */}
                            {isAdmin && (
                                <div className="mt-6 pt-4 border-t">
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" className="w-full text-destructive hover:text-destructive hover:bg-destructive/10">
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Delete Task
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This action cannot be undone. This will permanently delete the task and its data.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={handleDeleteTask}
                                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                >
                                                    Delete
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right column — Comments & Activity */}
                    <div className="w-full sm:w-[280px] flex flex-col border-l bg-muted/30">
                        <div className="px-4 py-3 border-b">
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                <MessageSquare className="h-3 w-3" />
                                Comments & Activity
                            </h4>
                        </div>

                        <ScrollArea className="flex-1 max-h-[400px]">
                            <div className="p-3 space-y-3">
                                {isLoadingComments ? (
                                    <div className="flex justify-center py-6">
                                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                    </div>
                                ) : comments.length === 0 ? (
                                    <p className="text-xs text-muted-foreground text-center py-6">
                                        No comments yet.
                                        <br />
                                        Be the first to comment!
                                    </p>
                                ) : (
                                    comments.map((comment: Comment) => (
                                        <div
                                            key={comment._id}
                                            className="rounded-lg bg-background p-2.5 border"
                                        >
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <Avatar className="h-5 w-5">
                                                    <AvatarImage src={comment.user?.image} />
                                                    <AvatarFallback className="text-[8px] font-bold">
                                                        {getInitials(comment.user?.name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="text-[11px] font-medium">
                                                    {comment.user?.name || "Unknown"}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground ml-auto">
                                                    {new Date(comment.createdAt).toLocaleTimeString("en-US", {
                                                        hour: "numeric",
                                                        minute: "2-digit",
                                                    })}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                                {comment.text}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </ScrollArea>

                        {/* Comment input with @mention dropdown */}
                        <div className="p-3 border-t mt-auto relative">
                            {/* @mention suggestions dropdown */}
                            {showMentions && filteredMentionUsers.length > 0 && (
                                <div className="absolute bottom-full left-3 right-3 mb-1 rounded-lg border bg-popover shadow-lg z-50 overflow-hidden">
                                    {filteredMentionUsers.map((u) => (
                                        <button
                                            key={u.id}
                                            className="flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-muted transition-colors text-left"
                                            onClick={() => handleSelectMention(u.name)}
                                        >
                                            <Avatar className="h-5 w-5">
                                                <AvatarImage src={u.image} />
                                                <AvatarFallback className="text-[8px] font-bold">
                                                    {getInitials(u.name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium">{u.name}</span>
                                            <span className="text-muted-foreground ml-auto truncate max-w-[80px]">
                                                {u.email}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}

                            <div className="flex gap-1.5">
                                <Input
                                    ref={commentInputRef}
                                    placeholder="Write a comment... use @ to tag"
                                    value={commentText}
                                    onChange={(e) => handleCommentChange(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !showMentions) {
                                            handleSendComment();
                                        }
                                        if (e.key === "Escape" && showMentions) {
                                            setShowMentions(false);
                                        }
                                    }}
                                    className="h-8 text-xs bg-background"
                                />
                                <Button
                                    size="sm"
                                    className="h-8 w-8 shrink-0 p-0"
                                    onClick={handleSendComment}
                                    disabled={!commentText.trim()}
                                >
                                    <Send className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-1">
                                Type @ to mention members
                            </p>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
