"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { ITask } from "@/models/task.model";
import { ICustomBoard } from "@/models/custom-board.model";
import { useAuthStore } from "@/stores/auth.store";
import { useProjectStore } from "@/stores/project.store";
import { useUserStore } from "@/stores/user.store";
import { useCustomBoardStore } from "@/stores/custom-board.store";
import { BoardColumn } from "@/components/board/BoardColumn";
import { BoardTaskModal } from "@/components/board/BoardTaskModal";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
    Layout,
    ArrowLeft,
    Trash2,
    Settings2,
    Users,
    Briefcase,
    Target,
    ListTodo,
    Hash
} from "lucide-react";
import Link from "next/link";
import { getCustomBoardByIdAction } from "@/actions/custom-board.actions";

const iconMap: any = {
    Layout,
    Briefcase,
    Target,
    ListTodo,
    Hash
};

export default function CustomBoardPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuthStore();
    const { fetchProjects } = useProjectStore();
    const { fetchUsers } = useUserStore();
    const { deleteBoard } = useCustomBoardStore();

    const [board, setBoard] = useState<ICustomBoard | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const [taskModalOpen, setTaskModalOpen] = useState(false);

    const boardId = params.id as string;

    useEffect(() => {
        const fetchBoard = async () => {
            setIsLoading(true);
            try {
                fetchUsers();
                fetchProjects();
                const result = await getCustomBoardByIdAction(boardId);
                if (result.success && result.data) {
                    setBoard(result.data as ICustomBoard);
                } else {
                    router.push("/overview");
                }
            } finally {
                setIsLoading(false);
            }
        };
        fetchBoard();
    }, [boardId, fetchUsers, fetchProjects, router]);

    const Icon = board ? iconMap[board.icon || "Layout"] || Layout : Layout;

    const handleDelete = async () => {
        if (confirm("Are you sure you want to delete this board?")) {
            await deleteBoard(boardId);
            router.push("/overview");
        }
    };

    const handleTaskClick = (task: ITask) => {
        setSelectedTaskId(task._id.toString());
        setTaskModalOpen(true);
    };

    return (
        <TooltipProvider>
            <div className="flex flex-col h-full w-full overflow-hidden">
                {/* Page Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b bg-background/50 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                        <Link href="/overview">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        {isLoading ? (
                            <Skeleton className="h-8 w-40" />
                        ) : (
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <Icon className="h-5 w-5 text-primary" />
                                </div>
                                <h1 className="text-xl font-bold tracking-tight">
                                    {board?.name}
                                </h1>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="h-8 gap-2 text-xs">
                            <Settings2 className="h-3.5 w-3.5" />
                            Settings
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-2 text-xs text-destructive hover:text-destructive"
                            onClick={handleDelete}
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-neutral-50/30 dark:bg-black/10">
                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="space-y-4">
                                    <Skeleton className="h-10 w-full" />
                                    <Skeleton className="h-32 w-full" />
                                    <Skeleton className="h-32 w-full" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-6">
                            {board?.description && (
                                <p className="text-sm text-muted-foreground max-w-2xl">
                                    {board.description}
                                </p>
                            )}

                            <div className="w-[340px]">
                                <BoardColumn
                                    title="All Board Tasks"
                                    tasks={board?.taskIds as any || []}
                                    boardId={boardId}
                                    isToday={false}
                                    onAddTask={() => { }} // Custom boards don't support quick add yet, must reference existing tasks
                                    onTaskClick={handleTaskClick}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Task Detail Modal */}
                <BoardTaskModal
                    taskId={selectedTaskId}
                    boardId=""
                    open={taskModalOpen}
                    onOpenChange={setTaskModalOpen}
                />
            </div>
        </TooltipProvider>
    );
}
