"use client";

import { useState, useEffect, useCallback } from "react";
import { ITask } from "@/models/task.model";
import { useAuthStore } from "@/stores/auth.store";
import { useProjectStore } from "@/stores/project.store";
import { useUserStore } from "@/stores/user.store";
import { useBoardStore } from "@/stores/board.store";
import { DailyBoard } from "@/types/board.types";
import { BoardColumn } from "@/components/board/BoardColumn";
import { BoardTaskModal } from "@/components/board/BoardTaskModal";
import { AddBoardTaskDialog } from "@/components/board/AddBoardTaskDialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
    CalendarDays,
    ArrowLeft,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import Link from "next/link";

function formatBoardDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString("default", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

function formatMonthYear(date: Date): string {
    return date.toLocaleDateString("default", {
        month: "long",
        year: "numeric",
    });
}

function isToday(dateStr: string): boolean {
    const d = new Date(dateStr);
    const today = new Date();
    return (
        d.getFullYear() === today.getFullYear() &&
        d.getMonth() === today.getMonth() &&
        d.getDate() === today.getDate()
    );
}

export default function BoardHistoryPage() {
    const { fetchProjects } = useProjectStore();
    const { fetchUsers } = useUserStore();
    const {
        boards,
        boardTasks,
        isLoading,
        fetchRecentBoards,
        fetchAllBoardTasks,
    } = useBoardStore();

    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const [selectedBoardId, setSelectedBoardId] = useState<string>("");
    const [taskModalOpen, setTaskModalOpen] = useState(false);
    const [addTaskDialogOpen, setAddTaskDialogOpen] = useState(false);
    const [addTaskBoardId, setAddTaskBoardId] = useState<string>("");
    const [limit, setLimit] = useState(14);
    const [isInitializing, setIsInitializing] = useState(true);

    useEffect(() => {
        let mounted = true;

        const init = async () => {
            try {
                fetchUsers();
                fetchProjects();

                const fetchedBoards = await fetchRecentBoards(limit);
                if (mounted && fetchedBoards && fetchedBoards.length > 0) {
                    const currentTasks = useBoardStore.getState().boardTasks;
                    const boardsToFetch = fetchedBoards
                        .filter((b: DailyBoard) => !currentTasks[b._id])
                        .map((b: DailyBoard) => ({ id: b._id, date: b.date }));

                    if (boardsToFetch.length > 0) {
                        await fetchAllBoardTasks(boardsToFetch);
                    }
                }
            } finally {
                if (mounted) setIsInitializing(false);
            }
        };
        init();

        return () => {
            mounted = false;
        };
    }, [fetchUsers, fetchProjects, fetchRecentBoards, fetchAllBoardTasks, limit]);

    const handleTaskClick = useCallback((task: ITask, boardId: string) => {
        setSelectedTaskId(task._id.toString());
        setSelectedBoardId(boardId);
        setTaskModalOpen(true);
    }, []);

    const handleAddTask = useCallback((boardId: string) => {
        setAddTaskBoardId(boardId);
        setAddTaskDialogOpen(true);
    }, []);

    const handleLoadMore = () => {
        setLimit((prev) => prev + 14);
    };

    return (
        <TooltipProvider>
            <div className="flex flex-col h-full w-full overflow-hidden">
                {/* Page Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <div className="flex items-center gap-3">
                        <Link href="/overview">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-primary/10">
                            <CalendarDays className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight">
                                Board History
                            </h1>
                            <p className="text-xs text-muted-foreground">
                                Browse past daily boards &middot;{" "}
                                {boards.length} boards loaded
                            </p>
                        </div>
                    </div>
                </div>

                {/* Board Grid */}
                {isLoading || isInitializing ? (
                    <div className="flex gap-4 p-6 overflow-x-auto flex-1 min-h-0">
                        {[1, 2, 3, 4].map((i) => (
                            <div
                                key={i}
                                className="w-[300px] shrink-0 space-y-3"
                            >
                                <Skeleton className="h-10 w-full rounded-lg" />
                                <Skeleton className="h-24 w-full rounded-lg" />
                                <Skeleton className="h-24 w-full rounded-lg" />
                            </div>
                        ))}
                    </div>
                ) : boards.length === 0 ? (
                    <div className="flex flex-col items-center justify-center flex-1 py-20">
                        <CalendarDays className="h-12 w-12 text-muted-foreground/50 mb-4" />
                        <p className="text-lg font-medium text-muted-foreground">
                            No boards found
                        </p>
                        <p className="text-sm text-muted-foreground/70 mt-1">
                            Boards are created automatically each day.
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col flex-1 overflow-hidden">
                        <div className="flex gap-4 p-6 overflow-x-auto flex-1 min-h-0">
                            {boards.map((board: DailyBoard) => {
                                const tasks = boardTasks[board._id] || [];
                                return (
                                    <BoardColumn
                                        key={board._id}
                                        title={formatBoardDate(board.date)}
                                        tasks={tasks}
                                        boardId={board._id}
                                        isToday={isToday(board.date)}
                                        onAddTask={() =>
                                            handleAddTask(board._id)
                                        }
                                        onTaskClick={(task) =>
                                            handleTaskClick(task, board._id)
                                        }
                                    />
                                );
                            })}

                            {/* Load more sentinel */}
                            <div className="flex items-center shrink-0">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-10 text-xs whitespace-nowrap"
                                    onClick={handleLoadMore}
                                    disabled={isLoading}
                                >
                                    Load older boards
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Task Detail Modal */}
                <BoardTaskModal
                    taskId={selectedTaskId}
                    boardId={selectedBoardId}
                    open={taskModalOpen}
                    onOpenChange={setTaskModalOpen}
                />

                {/* Add Task Dialog */}
                <AddBoardTaskDialog
                    boardId={addTaskBoardId}
                    open={addTaskDialogOpen}
                    onOpenChange={setAddTaskDialogOpen}
                />
            </div>
        </TooltipProvider>
    );
}
