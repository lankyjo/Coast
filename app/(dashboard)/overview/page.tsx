"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ClipboardList, Eye, Globe, Layers, RotateCw } from "lucide-react";
import { pusherClient } from "@/lib/pusher-client";

function formatBoardDate(dateStr: string): string {
    const d = new Date(dateStr);
    const month = d.toLocaleString('default', { month: 'short' });
    const day = d.getDate();
    return `${month} ${day}`;
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

export default function OverviewPage() {
    const { user } = useAuthStore();
    const { projects, fetchProjects } = useProjectStore();
    const { fetchUsers } = useUserStore();
    const {
        boards,
        boardTasks,
        isLoading,
        visibilityFilter,
        fetchRecentBoards,
        ensureTodayBoard,
        fetchBoardTasks,
        fetchAllBoardTasks,
        setVisibilityFilter,
    } = useBoardStore();

    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const [selectedBoardId, setSelectedBoardId] = useState<string>("");
    const [taskModalOpen, setTaskModalOpen] = useState(false);
    const [addTaskDialogOpen, setAddTaskDialogOpen] = useState(false);
    const [addTaskBoardId, setAddTaskBoardId] = useState<string>("");
    const [isInitializing, setIsInitializing] = useState(true);

    useEffect(() => {
        let mounted = true;

        const init = async () => {
            try {
                // Fire everything that can start immediately
                fetchUsers();
                fetchProjects();

                // Today's board is needed first to show today's column
                await ensureTodayBoard();

                // Fetch boards and immediately start fetching their tasks in parallel
                const fetchedBoards = await fetchRecentBoards();

                if (mounted && fetchedBoards && fetchedBoards.length > 0) {
                    const currentTasks = useBoardStore.getState().boardTasks;
                    const boardsToFetch = fetchedBoards
                        .filter((b: DailyBoard) => !currentTasks[b._id])
                        .map((b: DailyBoard) => ({ id: b._id, date: b.date }));

                    if (boardsToFetch.length > 0) {
                        fetchAllBoardTasks(boardsToFetch);
                    }
                }
            } finally {
                if (mounted) {
                    setIsInitializing(false);
                }
            }
        };
        init();

        return () => {
            mounted = false;
        };
    }, [fetchUsers, fetchProjects, ensureTodayBoard, fetchRecentBoards, fetchAllBoardTasks]);

    const boardIds = boards.map(b => b._id).join(',');
    const boardsRef = useRef(boards);

    useEffect(() => {
        boardsRef.current = boards;
    }, [boards]);

    // Real-time updates with Pusher
    useEffect(() => {
        if (!boardIds) return;

        const subscribedChannels: string[] = [];
        const currentBoards = boardsRef.current;

        currentBoards.forEach((board) => {
            const channelName = `board-${board._id}`;
            const channel = pusherClient.subscribe(channelName);
            subscribedChannels.push(channelName);

            channel.bind("task-updated", (data: { boardId: string;[key: string]: any }) => {
                // Re-fetch tasks for the updated board
                if (data.boardId) {
                    const matchedBoard = boardsRef.current.find(b => b._id === data.boardId);
                    fetchBoardTasks(data.boardId, matchedBoard?.date);
                }
            });
        });

        return () => {
            subscribedChannels.forEach((channelName) => {
                pusherClient.unsubscribe(channelName);
            });
        };
    }, [boardIds, fetchBoardTasks]);

    const handleTaskClick = useCallback((task: ITask, boardId: string) => {
        setSelectedTaskId(task._id.toString());
        setSelectedBoardId(boardId);
        setTaskModalOpen(true);
    }, []);

    const handleAddTask = useCallback((boardId: string) => {
        setAddTaskBoardId(boardId);
        setAddTaskDialogOpen(true);
    }, []);

    const getFilteredTasks = useCallback((tasks: ITask[]): ITask[] => {
        if (visibilityFilter === "all") return tasks;
        return tasks.filter((t: any) => t.visibility === visibilityFilter);
    }, [visibilityFilter]);

    return (
        <TooltipProvider>
            <div className="flex flex-col h-full w-full overflow-hidden">
                {/* Page Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-primary/10">
                            <ClipboardList className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight">Overview</h1>
                            <p className="text-xs text-muted-foreground">
                                Daily board: plan and track each day&apos;s tasks
                            </p>
                        </div>
                    </div>

                    {/* Actions: Refresh + Visibility */}
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-2 text-xs"
                            onClick={async () => {
                                const refreshedBoards = await fetchRecentBoards();
                                if (refreshedBoards && refreshedBoards.length > 0) {
                                    await fetchAllBoardTasks(refreshedBoards.map((b: DailyBoard) => ({ id: b._id, date: b.date })));
                                }
                            }}
                            disabled={isLoading}
                        >
                            <div className={isLoading ? "animate-spin" : ""}>
                                <RotateCw className="h-3.5 w-3.5" />
                            </div>
                            Refresh
                        </Button>

                        <Select
                            value={visibilityFilter}
                            onValueChange={(v) =>
                                setVisibilityFilter(v as "all" | "general" | "private")
                            }
                        >
                            <SelectTrigger className="h-8 w-[140px] text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    <span className="flex items-center gap-1.5">
                                        <Layers className="h-3 w-3" />
                                        All Tasks
                                    </span>
                                </SelectItem>
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

                {/* Board Container */}
                {isLoading || isInitializing ? (
                    <div className="flex gap-4 p-6 overflow-x-auto flex-1 min-h-0">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="w-[300px] shrink-0 space-y-3">
                                <Skeleton className="h-10 w-full rounded-lg" />
                                <Skeleton className="h-24 w-full rounded-lg" />
                                <Skeleton className="h-24 w-full rounded-lg" />
                            </div>
                        ))}
                    </div>
                ) : boards.length === 0 ? (
                    <div className="flex flex-col items-center justify-center flex-1 py-20">
                        <ClipboardList className="h-12 w-12 text-muted-foreground/50 mb-4" />
                        <p className="text-lg font-medium text-muted-foreground">
                            No boards yet
                        </p>
                        <p className="text-sm text-muted-foreground/70 mt-1">
                            Boards are created automatically each day.
                        </p>
                    </div>
                ) : (
                    <div className="flex gap-4 p-6 overflow-x-auto flex-1 min-h-0">
                        {boards.map((board: DailyBoard) => {
                            const tasks = boardTasks[board._id] || [];
                            const filtered = getFilteredTasks(tasks);
                            return (
                                <BoardColumn
                                    key={board._id}
                                    title={formatBoardDate(board.date)}
                                    tasks={filtered}
                                    boardId={board._id}
                                    isToday={isToday(board.date)}
                                    onAddTask={() => handleAddTask(board._id)}
                                    onTaskClick={(task) =>
                                        handleTaskClick(task, board._id)
                                    }
                                />
                            );
                        })}
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
