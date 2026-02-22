"use client";

import { ITask } from "@/models/task.model";
import { useAuthStore } from "@/stores/auth.store";
import { useBoardStore } from "@/stores/board.store";
import { BoardTaskCard } from "./BoardTaskCard";
import {
    ArrowRight,
    Archive,
    Inbox,
    Loader2,
} from "lucide-react";
import { useState } from "react";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface BacklogColumnProps {
    tasks: ITask[];
    onTaskClick: (task: ITask) => void;
}

export function BacklogColumn({ tasks, onTaskClick }: BacklogColumnProps) {
    const { user } = useAuthStore();
    const { reboardTask, toggleTaskDone } = useBoardStore();
    const [reboardingIds, setReboardingIds] = useState<Set<string>>(new Set());

    const isAdmin = user?.role === "admin";

    const handleReboard = async (e: React.MouseEvent, taskId: string) => {
        e.stopPropagation();
        setReboardingIds((prev) => new Set(prev).add(taskId));
        try {
            await reboardTask(taskId);
        } finally {
            setReboardingIds((prev) => {
                const next = new Set(prev);
                next.delete(taskId);
                return next;
            });
        }
    };

    // Group tasks by priority for better scanning
    const urgentTasks = tasks.filter((t: any) => t.priority === "urgent" || t.priority === "high");
    const otherTasks = tasks.filter((t: any) => t.priority !== "urgent" && t.priority !== "high");

    return (
        <div className="flex flex-col w-80 shrink-0 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 max-h-[calc(100vh-280px)] overflow-hidden">

            {/* Header */}
            <div className="flex items-center gap-2 px-3 pt-3 pb-2 shrink-0">
                <Inbox className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="font-semibold text-sm text-amber-800 dark:text-amber-200 truncate flex-1">
                    Backlog
                </span>
                {tasks.length > 0 && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-200/80 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 shrink-0 tabular-nums">
                        {tasks.length} pending
                    </span>
                )}
            </div>

            {/* Scrollable task list */}
            <div className="flex-1 overflow-y-auto min-h-0 px-2 pb-2 [&::-webkit-scrollbar]:w-0 [scrollbar-width:none]">
                {tasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-24 text-xs text-amber-500/60 dark:text-amber-600/50 select-none gap-1">
                        <Archive className="w-5 h-5" />
                        <span>All caught up!</span>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2 py-1">
                        {/* Urgent/High priority section */}
                        {urgentTasks.length > 0 && (
                            <>
                                <div className="text-[10px] uppercase tracking-wider font-semibold text-red-500 dark:text-red-400 px-1 pt-1">
                                    Needs attention
                                </div>
                                {urgentTasks.map((task) => (
                                    <BacklogTaskItem
                                        key={task._id as unknown as string}
                                        task={task}
                                        isAdmin={isAdmin}
                                        isReboarding={reboardingIds.has(task._id as unknown as string)}
                                        onReboard={handleReboard}
                                        onClick={() => onTaskClick(task)}
                                    />
                                ))}
                            </>
                        )}

                        {/* Other tasks */}
                        {otherTasks.length > 0 && (
                            <>
                                {urgentTasks.length > 0 && (
                                    <div className="text-[10px] uppercase tracking-wider font-semibold text-amber-500/70 dark:text-amber-500/50 px-1 pt-1.5">
                                        Other
                                    </div>
                                )}
                                {otherTasks.map((task) => (
                                    <BacklogTaskItem
                                        key={task._id as unknown as string}
                                        task={task}
                                        isAdmin={isAdmin}
                                        isReboarding={reboardingIds.has(task._id as unknown as string)}
                                        onReboard={handleReboard}
                                        onClick={() => onTaskClick(task)}
                                    />
                                ))}
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

/** A single backlog task card with re-board action overlay */
function BacklogTaskItem({
    task,
    isAdmin,
    isReboarding,
    onReboard,
    onClick,
}: {
    task: ITask;
    isAdmin: boolean;
    isReboarding: boolean;
    onReboard: (e: React.MouseEvent, taskId: string) => void;
    onClick: () => void;
}) {
    const taskId = task._id as unknown as string;

    return (
        <div className="relative group">
            <BoardTaskCard
                task={task}
                boardId=""
                onClick={onClick}
            />
            {/* Re-board overlay button */}
            {isAdmin && (
                <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                onClick={(e) => onReboard(e, taskId)}
                                disabled={isReboarding}
                                className="flex items-center gap-1 px-1.5 py-1 rounded-md bg-blue-500 hover:bg-blue-600 text-white text-[10px] font-medium shadow-sm transition-colors duration-150 disabled:opacity-50"
                            >
                                {isReboarding ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                    <>
                                        <ArrowRight className="w-3 h-3" />
                                        Today
                                    </>
                                )}
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="text-xs">
                            Move to today&apos;s board
                        </TooltipContent>
                    </Tooltip>
                </div>
            )}
        </div>
    );
}
