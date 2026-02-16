"use client";

import { useEffect, useState } from "react";
import { useProjectStore } from "@/stores/project.store";
import { useUIStore } from "@/stores/ui.store";
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Search, FolderKanban } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { IProject } from "@/models/project.model";

export default function ProjectsPage() {
    const { projects, fetchProjects, createProject, isLoading } = useProjectStore();
    const [mounted, setMounted] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const searchParams = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        if (searchParams.get("new") === "true") {
            setIsCreateOpen(true);
            router.replace("/projects"); // Clear the param
        }
    }, [searchParams, router]);

    // Create form state
    const [newProject, setNewProject] = useState({
        name: "",
        description: "",
        startDate: new Date().toISOString().split("T")[0],
        deadline: "",
        tags: "",
    });

    useEffect(() => {
        setMounted(true);
        fetchProjects();
    }, [fetchProjects]);

    if (!mounted) return null;

    const filteredProjects = projects.filter(
        (p) =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCreate = async () => {
        if (!newProject.name || !newProject.deadline) return;

        await createProject({
            name: newProject.name,
            description: newProject.description,
            startDate: newProject.startDate,
            deadline: newProject.deadline,
            tags: newProject.tags.split(",").map((t) => t.trim()).filter(Boolean),
        });

        setNewProject({
            name: "",
            description: "",
            startDate: new Date().toISOString().split("T")[0],
            deadline: "",
            tags: "",
        });
        setIsCreateOpen(false);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "active":
                return "default";
            case "completed":
                return "secondary";
            case "on_hold":
                return "outline";
            default:
                return "secondary";
        }
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
                    <p className="text-muted-foreground">
                        Manage and track all your team&apos;s projects.
                    </p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> New Project
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Create New Project</DialogTitle>
                            <DialogDescription>
                                Add a new project to your workspace.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Project Name</Label>
                                <Input
                                    id="name"
                                    placeholder="My Awesome Project"
                                    value={newProject.name}
                                    onChange={(e) =>
                                        setNewProject((prev) => ({ ...prev, name: e.target.value }))
                                    }
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="description">Description</Label>
                                <Input
                                    id="description"
                                    placeholder="Brief project description..."
                                    value={newProject.description}
                                    onChange={(e) =>
                                        setNewProject((prev) => ({
                                            ...prev,
                                            description: e.target.value,
                                        }))
                                    }
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="startDate">Start Date</Label>
                                    <Input
                                        id="startDate"
                                        type="date"
                                        value={newProject.startDate}
                                        onChange={(e) =>
                                            setNewProject((prev) => ({
                                                ...prev,
                                                startDate: e.target.value,
                                            }))
                                        }
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="deadline">Deadline</Label>
                                    <Input
                                        id="deadline"
                                        type="date"
                                        value={newProject.deadline}
                                        onChange={(e) =>
                                            setNewProject((prev) => ({
                                                ...prev,
                                                deadline: e.target.value,
                                            }))
                                        }
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="tags">Tags (comma-separated)</Label>
                                <Input
                                    id="tags"
                                    placeholder="design, frontend, urgent"
                                    value={newProject.tags}
                                    onChange={(e) =>
                                        setNewProject((prev) => ({ ...prev, tags: e.target.value }))
                                    }
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleCreate} disabled={!newProject.name || !newProject.deadline}>
                                Create Project
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    placeholder="Search projects..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Projects Grid */}
            {isLoading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Card key={i}>
                            <CardHeader>
                                <Skeleton className="h-5 w-3/4" />
                                <Skeleton className="h-4 w-full" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-4 w-1/2" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : filteredProjects.length === 0 ? (
                <Card className="flex flex-col items-center justify-center py-16">
                    <FolderKanban className="mb-4 h-12 w-12 text-muted-foreground/50" />
                    <CardTitle className="mb-2 text-lg">
                        {searchQuery ? "No projects found" : "No projects yet"}
                    </CardTitle>
                    <CardDescription className="mb-4">
                        {searchQuery
                            ? "Try a different search term."
                            : "Create your first project to get started."}
                    </CardDescription>
                    {!searchQuery && (
                        <Button onClick={() => setIsCreateOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" /> Create Project
                        </Button>
                    )}
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredProjects.map((project) => (
                        <Link key={project._id?.toString()} href={`/projects/${project._id}`}>
                            <Card className="h-full transition-all hover:shadow-md hover:border-primary/20 cursor-pointer">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <CardTitle className="text-lg">{project.name}</CardTitle>
                                        <Badge variant={getStatusColor(project.status) as any}>
                                            {project.status}
                                        </Badge>
                                    </div>
                                    <CardDescription className="line-clamp-2">
                                        {project.description || "No description"}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                                        <span>Progress: {project.progress || 0}%</span>
                                        <span>
                                            Due:{" "}
                                            {project.deadline
                                                ? new Date(project.deadline).toLocaleDateString()
                                                : "No deadline"}
                                        </span>
                                    </div>
                                    {/* Progress Bar */}
                                    <div className="mt-2 h-1.5 w-full rounded-full bg-muted">
                                        <div
                                            className="h-1.5 rounded-full bg-primary transition-all"
                                            style={{ width: `${project.progress || 0}%` }}
                                        />
                                    </div>
                                    {/* Tags */}
                                    {project.tags && project.tags.length > 0 && (
                                        <div className="mt-3 flex flex-wrap gap-1">
                                            {project.tags.slice(0, 3).map((tag) => (
                                                <Badge key={tag} variant="outline" className="text-xs">
                                                    {tag}
                                                </Badge>
                                            ))}
                                            {project.tags.length > 3 && (
                                                <Badge variant="outline" className="text-xs">
                                                    +{project.tags.length - 3}
                                                </Badge>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
