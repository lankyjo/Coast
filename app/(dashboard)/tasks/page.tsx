"use client";

import { useEffect, useState } from "react";
import { useTaskStore } from "@/stores/task.store";
import { useProjectStore } from "@/stores/project.store";
import { useAuthStore } from "@/stores/auth.store";
import { useUserStore } from "@/stores/user.store";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
    CheckSquare,
    Search,
    Circle,
    Clock,
    Eye,
    CheckCircle2,
    Calendar,
    LayoutGrid,
    List,
    X,
    User,
    Users,
    ChevronLeft,
    ChevronRight,
    CalendarClock,
} from "lucide-react";
import {
    Tabs,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { TASK_STATUS_LABELS, TASK_STATUS_ORDER, TaskStatus } from "@/constants/task-status";
import { PRIORITY_LABELS, PRIORITY_ORDER, Priority } from "@/constants/priority";
import { TaskDetailModal } from "@/components/tasks/TaskDetailModal";
import { ITask } from "@/models/task.model";

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

export default function TasksPage() {
    const {
        tasks,
        fetchTasks,
        isLoading,
        viewMode,
        setViewMode,
        filters,
        setFilters,
        currentPage,
        totalPages,
        totalTasks,
    } = useTaskStore();
    const { projects, fetchProjects } = useProjectStore();
    const { user } = useAuthStore();
    const { users, fetchUsers } = useUserStore();
    const [mounted, setMounted] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

    useEffect(() => {
        setMounted(true);
        // Default to "My Tasks" for members
        const initialAssignee = user?.role === "member" ? user.id : "all";
        setFilters({ assignee: initialAssignee });
        fetchTasks({ assignee: initialAssignee });
        fetchProjects();
        fetchUsers();
    }, [fetchTasks, fetchProjects, user, setFilters, fetchUsers]);

    if (!mounted) return null;

    // Client-side search filter (on top of server-side filters)
    const filteredTasks = tasks.filter((t) => {
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            return (
                t.title.toLowerCase().includes(q) ||
                t.description?.toLowerCase().includes(q)
            );
        }
        return true;
    });

    const handleStatusFilter = (status: TaskStatus | "all") => {
        setFilters({ status, page: 1 });
        fetchTasks({ status, page: 1 });
    };

    const handlePriorityFilter = (priority: Priority | "all") => {
        setFilters({ priority, page: 1 });
        fetchTasks({ priority, page: 1 });
    };

    const handleProjectFilter = (project: string | "all") => {
        setFilters({ project, page: 1 });
        fetchTasks({ project, page: 1 });
    };

    const handleAssigneeFilter = (assignee: string | "all") => {
        setFilters({ assignee, page: 1 });
        fetchTasks({ assignee, page: 1 });
    };

    const handleDueTodayFilter = () => {
        const newDueToday = !filters.dueToday;
        setFilters({ dueToday: newDueToday, page: 1 });
        fetchTasks({ dueToday: newDueToday, page: 1 });
    };

    const handlePageChange = (page: number) => {
        setFilters({ page });
        fetchTasks({ page });
    };

    const handleOpenDetail = (taskId: string | null) => {
        setSelectedTaskId(taskId);
    };

    const selectedTask = (tasks || []).find(t => t._id.toString() === selectedTaskId) || null;

    const activeFilterCount =
        (filters.status !== "all" ? 1 : 0) +
        (filters.priority !== "all" ? 1 : 0) +
        (filters.project !== "all" ? 1 : 0) +
        (filters.dueToday ? 1 : 0);

    const clearFilters = () => {
        setFilters({ status: "all", priority: "all", project: "all", dueToday: false, page: 1 });
        fetchTasks({ status: "all", priority: "all", project: "all", dueToday: false, page: 1 });
    };

    // Group by status for Kanban
    const tasksByStatus: Record<string, ITask[]> = {};
    TASK_STATUS_ORDER.forEach((status) => {
        tasksByStatus[status] = filteredTasks.filter((t) => t.status === status);
    });

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
                        <p className="text-muted-foreground">
                            View and manage tasks across all projects.
                        </p>
                    </div>

                    {/* My Tasks / All Tasks Toggle */}
                    <Tabs
                        value={filters.assignee === user?.id ? "mine" : "all"}
                        onValueChange={(v) => handleAssigneeFilter(v === "mine" ? user?.id || "" : "all")}
                        className="w-[200px]"
                    >
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="mine" className="text-xs">
                                <User className="mr-2 h-3.5 w-3.5" />
                                My Tasks
                            </TabsTrigger>
                            <TabsTrigger value="all" className="text-xs">
                                <Users className="mr-2 h-3.5 w-3.5" />
                                All Tasks
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                    {/* Search */}
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search tasks..."
                            className="pl-9 h-9"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="flex items-center gap-1 rounded-lg border p-0.5">
                        <Button
                            variant={filters.status === "all" ? "default" : "ghost"}
                            size="sm"
                            className="h-7 text-xs px-2"
                            onClick={() => handleStatusFilter("all")}
                        >
                            All
                        </Button>
                        {TASK_STATUS_ORDER.map((s) => {
                            const Icon = STATUS_ICONS[s];
                            return (
                                <Button
                                    key={s}
                                    variant={filters.status === s ? "default" : "ghost"}
                                    size="sm"
                                    className="h-7 text-xs px-2"
                                    onClick={() => handleStatusFilter(s)}
                                >
                                    <Icon className="mr-1 h-3 w-3" />
                                    <span className="hidden lg:inline">{TASK_STATUS_LABELS[s]}</span>
                                </Button>
                            );
                        })}
                    </div>

                    {/* Priority Filter */}
                    <div className="flex items-center gap-1 rounded-lg border p-0.5">
                        <Button
                            variant={filters.priority === "all" ? "default" : "ghost"}
                            size="sm"
                            className="h-7 text-xs px-2"
                            onClick={() => handlePriorityFilter("all")}
                        >
                            All
                        </Button>
                        {PRIORITY_ORDER.map((p) => (
                            <Button
                                key={p}
                                variant={filters.priority === p ? PRIORITY_BADGE_VARIANT[p] : "ghost"}
                                size="sm"
                                className="h-7 text-xs px-2"
                                onClick={() => handlePriorityFilter(p)}
                            >
                                {PRIORITY_LABELS[p]}
                            </Button>
                        ))}
                    </div>

                    {/* Clear Filters */}
                    {activeFilterCount > 0 && (
                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={clearFilters}>
                            <X className="mr-1 h-3 w-3" /> Clear ({activeFilterCount})
                        </Button>
                    )}

                    {/* Due Today Filter */}
                    <Button
                        variant={filters.dueToday ? "default" : "outline"}
                        size="sm"
                        className="h-7 text-xs gap-1"
                        onClick={handleDueTodayFilter}
                    >
                        <CalendarClock className="h-3.5 w-3.5" />
                        Due Today
                    </Button>
                </div>

                {/* View Toggle */}
                <div className="flex items-center rounded-lg border p-0.5 shrink-0 self-end sm:self-auto">
                    <Button
                        variant={viewMode === "kanban" ? "default" : "ghost"}
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setViewMode("kanban")}
                    >
                        <LayoutGrid className="mr-1 h-3.5 w-3.5" /> Kanban
                    </Button>
                    <Button
                        variant={viewMode === "list" ? "default" : "ghost"}
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setViewMode("list")}
                    >
                        <List className="mr-1 h-3.5 w-3.5" /> List
                    </Button>
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
            ) : filteredTasks.length === 0 ? (
                <Card className="flex flex-col items-center justify-center py-16">
                    <CheckSquare className="mb-4 h-12 w-12 text-muted-foreground/50" />
                    <CardTitle className="mb-2 text-lg">
                        {searchQuery || activeFilterCount > 0
                            ? "No tasks match your filters"
                            : "No tasks yet"}
                    </CardTitle>
                    <CardDescription>
                        {searchQuery || activeFilterCount > 0
                            ? "Try adjusting your search or filters."
                            : "Create tasks from a project page."}
                    </CardDescription>
                    {activeFilterCount > 0 && (
                        <Button variant="outline" className="mt-4" onClick={clearFilters}>
                            Clear Filters
                        </Button>
                    )}
                </Card>
            ) : viewMode === "kanban" ? (
                /* ========= KANBAN VIEW ========= */
                <div className="grid gap-4 md:grid-cols-4">
                    {TASK_STATUS_ORDER.map((status) => {
                        const statusTasks = tasksByStatus[status] || [];
                        const Icon = STATUS_ICONS[status] || Circle;
                        return (
                            <div key={status} className="space-y-3">
                                <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2">
                                    <div className="flex items-center gap-2 text-sm font-medium">
                                        <Icon className="h-4 w-4" />
                                        {TASK_STATUS_LABELS[status]}
                                    </div>
                                    <Badge variant="secondary" className="text-xs">
                                        {statusTasks.length}
                                    </Badge>
                                </div>
                                <div className="space-y-2">
                                    {statusTasks.length === 0 ? (
                                        <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                                            No tasks
                                        </div>
                                    ) : (
                                        statusTasks.map((task) => (
                                            <Card
                                                key={task._id?.toString()}
                                                className="cursor-pointer transition-all hover:shadow-sm hover:border-primary/20"
                                                onClick={() => handleOpenDetail(task._id.toString())}
                                            >
                                                <CardContent className="p-3">
                                                    <p className="text-sm font-medium">{task.title}</p>
                                                    {task.description && (
                                                        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                                                            {task.description}
                                                        </p>
                                                    )}
                                                    <div className="mt-2 flex items-center justify-between">
                                                        <div className="flex -space-x-2 overflow-hidden">
                                                            {task.assigneeIds?.slice(0, 3).map((id, i) => {
                                                                const user = users.find((u: any) => u.id === id?.toString());
                                                                return (
                                                                    <div
                                                                        key={id?.toString()}
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
                                                            variant={PRIORITY_BADGE_VARIANT[task.priority] || "outline"}
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
                    <CardContent className="p-0">
                        <div className="divide-y">
                            {filteredTasks.map((task) => {
                                const Icon = STATUS_ICONS[task.status] || Circle;
                                return (
                                    <div
                                        key={task._id?.toString()}
                                        className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-muted/50 cursor-pointer"
                                        onClick={() => handleOpenDetail(task._id.toString())}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium truncate">{task.title}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {TASK_STATUS_LABELS[task.status as TaskStatus]}
                                                    {task.projectId && (
                                                        <span className="ml-2 text-muted-foreground/60">
                                                            • {projects.find((p) => p._id?.toString() === task.projectId?.toString())?.name || "Project"}
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0">
                                            <div className="flex -space-x-2 overflow-hidden mr-2">
                                                {task.assigneeIds?.slice(0, 3).map((id, i) => {
                                                    const user = users.find((u: any) => u.id === id?.toString());
                                                    return (
                                                        <div
                                                            key={id?.toString()}
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
                                                variant={PRIORITY_BADGE_VARIANT[task.priority] || "outline"}
                                                className="text-xs"
                                            >
                                                {task.priority}
                                            </Badge>
                                            {task.deadline && (
                                                <span className="text-xs text-muted-foreground hidden sm:inline">
                                                    {new Date(task.deadline).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Pagination Controls */}
            {!isLoading && filteredTasks.length > 0 && totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                    <span className="text-sm text-muted-foreground">
                        Showing {((currentPage - 1) * (filters.limit || 20)) + 1}–{Math.min(currentPage * (filters.limit || 20), totalTasks)} of {totalTasks} tasks
                    </span>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1"
                            disabled={currentPage <= 1}
                            onClick={() => handlePageChange(currentPage - 1)}
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                        </Button>
                        <span className="text-sm font-medium px-2">
                            {currentPage} / {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1"
                            disabled={currentPage >= totalPages}
                            onClick={() => handlePageChange(currentPage + 1)}
                        >
                            Next
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
            {/* Task Detail Modal */}
            <TaskDetailModal
                key={selectedTaskId || "task-detail-modal"}
                task={selectedTask}
                open={!!selectedTaskId}
                onOpenChange={(open) => !open && handleOpenDetail(null)}
            />
        </div>
    );
}
