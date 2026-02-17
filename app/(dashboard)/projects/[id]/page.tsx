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
import { DatePickerWithPresets } from "@/components/ui/date-picker-with-presets";
import { CreateTaskForm } from "@/components/tasks/CreateTaskForm";
import { useUserStore } from "@/stores/user.store";
import { ProjectActions } from "@/components/projects/ProjectActions";

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
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

    const handleOpenDetail = (taskId: string | null) => {
        setSelectedTaskId(taskId);
    };

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

    const selectedTask = tasks.find(t => t._id.toString() === selectedTaskId) || null;

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
                                        <CreateTaskForm
                                            projectId={id}
                                            onSuccess={() => setIsCreateOpen(false)}
                                            onCancel={() => setIsCreateOpen(false)}
                                        />
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

        </div>
    );
}
