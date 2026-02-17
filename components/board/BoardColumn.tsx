"use client";

import { ITask } from "@/models/task.model";
import { useAuthStore } from "@/stores/auth.store";
import { BoardTaskCard } from "./BoardTaskCard";
import { Plus } from "lucide-react";
import * as React from "react";

interface BoardColumnProps {
    title: string;
    tasks: ITask[];
    boardId: string;
    isToday: boolean;
    onAddTask: () => void;
    onTaskClick: (task: ITask) => void;
}

export function BoardColumn({
    title,
    tasks,
    boardId,
    isToday,
    onAddTask,
    onTaskClick,
}: BoardColumnProps) {
    const { user } = useAuthStore();
    const isAdmin = user?.role === "admin";

    return (
        <div className="flex flex-col w-72 shrink-0 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 max-h-[400px] overflow-hidden">

            {/* Header */}
            <div className="flex items-center gap-2 px-3 pt-3 pb-2 shrink-0">
                <span className="font-semibold text-sm text-neutral-800 dark:text-neutral-100 truncate flex-1">
                    {title}
                </span>
                {isToday && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 shrink-0">
                        Today
                    </span>
                )}
                <span className="text-xs text-neutral-400 dark:text-neutral-500 shrink-0 tabular-nums">
                    {tasks.length}
                </span>
            </div>

            {/* Scrollable task list — no visible scrollbar */}
            <div className="flex-1 overflow-y-auto min-h-0 px-2 pb-1 [&::-webkit-scrollbar]:w-0 [scrollbar-width:none]">
                {tasks.length === 0 ? (
                    <div className="flex items-center justify-center h-20 text-xs text-neutral-400 dark:text-neutral-600 select-none">
                        No tasks yet
                    </div>
                ) : (
                    <div className="flex flex-col gap-2 py-1">
                        {tasks.map((task) => (
                            <BoardTaskCard
                                key={task._id as unknown as string}
                                task={task}
                                boardId={boardId}
                                onClick={() => onTaskClick(task)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Footer — always pinned */}
            {isAdmin && (
                <div className="shrink-0 px-2 pb-2 pt-1 border-t border-neutral-200 dark:border-neutral-800">
                    <button
                        onClick={onAddTask}
                        className="flex items-center gap-1.5 w-full rounded-lg px-2 py-1.5 text-xs font-medium text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors duration-150"
                    >
                        <Plus className="w-3.5 h-3.5 shrink-0" />
                        Add a card
                    </button>
                </div>
            )}
        </div>
    );
}