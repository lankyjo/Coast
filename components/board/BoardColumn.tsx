"use client";

import { ITask } from "@/models/task.model";
import { useAuthStore } from "@/stores/auth.store";
import { BoardTaskCard } from "./BoardTaskCard";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

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
        <div className="flex flex-col w-[300px] shrink-0 rounded-xl bg-muted/50 border">
            {/* Column Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold tracking-tight">
                        {title}
                    </h3>
                    {isToday && (
                        <span className="inline-flex items-center rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">
                            Today
                        </span>
                    )}
                </div>
                <span className="text-xs text-muted-foreground">
                    {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
                </span>
            </div>

            {/* Tasks */}
            <ScrollArea className="flex-1 max-h-[calc(100vh-240px)]">
                <div className="p-2 space-y-2">
                    {tasks.length === 0 ? (
                        <div className="flex items-center justify-center py-8">
                            <p className="text-xs text-muted-foreground">
                                No tasks yet
                            </p>
                        </div>
                    ) : (
                        tasks.map((task) => (
                            <BoardTaskCard
                                key={task._id.toString()}
                                task={task}
                                boardId={boardId}
                                onClick={() => onTaskClick(task)}
                            />
                        ))
                    )}
                </div>
            </ScrollArea>

            {/* Add card button (admin only) */}
            {isAdmin && (
                <div className="p-2 border-t">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start gap-2 text-muted-foreground hover:text-primary text-xs"
                        onClick={onAddTask}
                    >
                        <Plus className="h-3.5 w-3.5" />
                        Add a card
                    </Button>
                </div>
            )}
        </div>
    );
}
