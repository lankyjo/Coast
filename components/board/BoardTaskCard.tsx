"use client";

import { ITask } from "@/models/task.model";
import { useAuthStore } from "@/stores/auth.store";
import { useUserStore } from "@/stores/user.store";
import { useProjectStore } from "@/stores/project.store";
import { useBoardStore } from "@/stores/board.store";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    CheckCircle2,
    Circle,
    MessageSquare,
} from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface BoardTaskCardProps {
    task: ITask;
    boardId: string;
    onClick: () => void;
}

const PRIORITY_COLORS: Record<string, string> = {
    urgent: "bg-red-500/15 text-red-400 border-red-500/30",
    high: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    medium: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    low: "bg-slate-500/15 text-slate-400 border-slate-500/30",
};

export function BoardTaskCard({ task, boardId, onClick }: BoardTaskCardProps) {
    const { user } = useAuthStore();
    const { users } = useUserStore();
    const { projects } = useProjectStore();
    const { toggleTaskDone } = useBoardStore();

    const isAdmin = user?.role === "admin";
    const isAssignee = task.assigneeIds?.some(
        (id: any) => id.toString() === user?.id
    );
    const canToggleDone = isAdmin || isAssignee;
    const isDone = task.status === "done";

    const project = projects.find(
        (p: any) => p._id?.toString() === task.projectId?.toString()
    );

    const handleToggle = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!canToggleDone) return;
        await toggleTaskDone(task._id.toString(), boardId);
    };

    return (
        <div
            onClick={onClick}
            className={cn(
                "group cursor-pointer rounded-lg border bg-card p-3 transition-all hover:shadow-md hover:border-primary/30",
                isDone && "opacity-60"
            )}
        >
            {/* Done checkbox + Title */}
            <div className="flex items-start gap-2.5">
                <button
                    onClick={handleToggle}
                    disabled={!canToggleDone}
                    className={cn(
                        "mt-0.5 shrink-0 transition-colors",
                        canToggleDone
                            ? "hover:text-primary cursor-pointer"
                            : "cursor-not-allowed opacity-50"
                    )}
                >
                    {isDone ? (
                        <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
                    ) : (
                        <Circle className="h-4.5 w-4.5 text-muted-foreground" />
                    )}
                </button>
                <span
                    className={cn(
                        "text-sm font-medium leading-snug",
                        isDone && "line-through text-muted-foreground"
                    )}
                >
                    {task.title}
                </span>
            </div>

            {/* Metadata row */}
            <div className="mt-2.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Priority */}
                    <Badge
                        variant="outline"
                        className={cn(
                            "text-[10px] h-5 px-1.5 font-medium capitalize",
                            PRIORITY_COLORS[task.priority] || ""
                        )}
                    >
                        {task.priority}
                    </Badge>

                    {/* Project */}
                    {project && (
                        <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">
                            {project.name}
                        </span>
                    )}
                </div>

                {/* Assignees + Comments */}
                <div className="flex items-center gap-1.5">
                    {/* Comment icon placeholder */}
                    <MessageSquare className="h-3 w-3 text-muted-foreground" />

                    {/* Assignee avatars */}
                    <div className="flex -space-x-1.5">
                        {(task.assigneeIds || []).slice(0, 3).map((id: any) => {
                            const u = users.find(
                                (u) => u.id === id.toString()
                            );
                            return (
                                <Tooltip key={id.toString()}>
                                    <TooltipTrigger asChild>
                                        <Avatar className="h-5 w-5 border border-background">
                                            <AvatarImage src={u?.image} />
                                            <AvatarFallback className="text-[8px] bg-muted font-bold">
                                                {u?.name?.charAt(0) || "?"}
                                            </AvatarFallback>
                                        </Avatar>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="text-xs">
                                        {u?.name || "Unknown"}
                                    </TooltipContent>
                                </Tooltip>
                            );
                        })}
                        {(task.assigneeIds || []).length > 3 && (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[8px] font-medium border border-background">
                                +{task.assigneeIds.length - 3}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Deadline row */}
            {task.deadline && (
                <div className="mt-1.5">
                    <span className="text-[10px] text-muted-foreground">
                        {new Date(task.deadline).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                        })}
                    </span>
                </div>
            )}

            {/* Visibility indicator for private tasks */}
            {(task as any).visibility === "private" && (
                <div className="mt-1.5">
                    <Badge variant="outline" className="text-[9px] h-4 px-1 text-amber-400 border-amber-500/30">
                        Private
                    </Badge>
                </div>
            )}
        </div>
    );
}
