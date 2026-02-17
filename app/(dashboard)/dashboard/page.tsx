"use client";

import { useEffect, useState } from "react";
import { useProjectStore } from "@/stores/project.store";
import { useTaskStore } from "@/stores/task.store";
import { useAuthStore } from "@/stores/auth.store";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    FolderKanban,
    CheckSquare,
    Clock,
    TrendingUp,
    Plus,
    ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { AIKeyPointsCard } from "@/components/dashboard/AIKeyPointsCard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";

export default function DashboardPage() {
    const { user } = useAuthStore();
    const { projects, fetchProjects, isLoading: projectsLoading } = useProjectStore();
    const { tasks, fetchTasks, isLoading: tasksLoading } = useTaskStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        fetchProjects();
        fetchTasks();
    }, [fetchProjects, fetchTasks]);

    if (!mounted) return null;

    const isLoading = projectsLoading || tasksLoading;

    // Filter tasks assigned to current user
    const myTasks = tasks.filter((t: any) =>
        t.assigneeIds?.some((id: any) => id.toString() === user?.id)
    );

    // Derived stats
    const isAdmin = user?.role === "admin";
    const displayTasks = isAdmin ? tasks : myTasks;

    const activeProjectsCount = projects.filter((p) => p.status === "active").length;
    const totalTasksCount = displayTasks.length;
    const completedTasksCount = displayTasks.filter((t = {} as any) => t.status === "done").length;
    const inProgressTasksCount = displayTasks.filter((t = {} as any) => t.status === "in_progress").length;
    const completionRate = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

    const stats = [
        {
            title: "Active Projects",
            value: activeProjectsCount,
            icon: FolderKanban,
            description: `${projects.length} total`,
            color: "text-blue-500",
        },
        {
            title: isAdmin ? "Total Tasks" : "My Tasks",
            value: totalTasksCount,
            icon: CheckSquare,
            description: `${completedTasksCount} completed`,
            color: "text-green-500",
        },
        {
            title: "In Progress",
            value: inProgressTasksCount,
            icon: Clock,
            description: "tasks underway",
            color: "text-amber-500",
        },
        {
            title: "Completion Rate",
            value: `${completionRate}%`,
            icon: TrendingUp,
            description: "overall progress",
            color: "text-emerald-500",
        },
    ];

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
                    </h1>
                    <p className="text-muted-foreground">
                        {isAdmin
                            ? "Here's an overview of the workspace."
                            : "Here are your tasks and project updates."}
                    </p>
                </div>
                {isAdmin && (
                    <Button asChild>
                        <Link href="/projects?new=true">
                            <Plus className="mr-2 h-4 w-4" /> New Project
                        </Link>
                    </Button>
                )}
            </div>

            {/* AI Insights - Only for Admins */}
            {isAdmin && (
                <div className="mb-6">
                    <AIKeyPointsCard />
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <Card key={stat.title}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {stat.title}
                            </CardTitle>
                            <stat.icon className={`h-4 w-4 ${stat.color}`} />
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <Skeleton className="h-8 w-20" />
                            ) : (
                                <>
                                    <div className="text-2xl font-bold">{stat.value}</div>
                                    <p className="text-xs text-muted-foreground">{stat.description}</p>
                                </>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Content Grid: Recent Projects, Tasks & Activity */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* My/Recent Tasks */}
                <Card className={!isAdmin ? "md:order-1" : ""}>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>{isAdmin ? "Recent Tasks" : "My Tasks"}</CardTitle>
                            <Button variant="ghost" size="sm" asChild>
                                <Link href="/tasks">
                                    View all <ArrowRight className="ml-1 h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                        <CardDescription>
                            {isAdmin ? "Latest tasks across all projects" : "Tasks currently assigned to you"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map((i) => (
                                    <Skeleton key={i} className="h-12 w-full" />
                                ))}
                            </div>
                        ) : displayTasks.length === 0 ? (
                            <p className="py-4 text-center text-sm text-muted-foreground">
                                {isAdmin ? "No tasks yet." : "You have no tasks assigned to you right now."}
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {displayTasks.slice(0, 5).map((task) => (
                                    <div
                                        key={task._id?.toString()}
                                        className="flex items-center justify-between rounded-lg border p-3"
                                    >
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium leading-none">{task.title}</p>
                                            <p className="text-xs text-muted-foreground capitalize">
                                                {task.priority} priority
                                                {task.totalTimeSpent > 0 && (
                                                    <span className="ml-2 inline-flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {Math.round(task.totalTimeSpent / 60)}m
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                        <Badge
                                            variant={
                                                task.status === "done"
                                                    ? "default"
                                                    : task.status === "in_progress"
                                                        ? "secondary"
                                                        : "outline"
                                            }
                                        >
                                            {task.status?.replace("_", " ")}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Projects */}
                <Card className={!isAdmin ? "md:order-2" : ""}>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Recent Projects</CardTitle>
                            <Button variant="ghost" size="sm" asChild>
                                <Link href="/projects">
                                    View all <ArrowRight className="ml-1 h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                        <CardDescription>Latest project activity</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map((i) => (
                                    <Skeleton key={i} className="h-12 w-full" />
                                ))}
                            </div>
                        ) : projects.length === 0 ? (
                            <p className="py-4 text-center text-sm text-muted-foreground">
                                No projects yet.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {projects.slice(0, 5).map((project) => (
                                    <Link
                                        key={project._id?.toString()}
                                        href={`/projects/${project._id}`}
                                        className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                                    >
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium leading-none">{project.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {project.description?.slice(0, 60)}
                                                {(project.description?.length || 0) > 60 ? "..." : ""}
                                            </p>
                                        </div>
                                        <Badge
                                            variant={project.status === "active" ? "default" : "secondary"}
                                        >
                                            {project.status}
                                        </Badge>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Activity Feed */}
                <div className="lg:col-span-1">
                    <ActivityFeed />
                </div>
            </div>
        </div>
    );
}
