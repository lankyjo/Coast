"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, Trash2, Loader2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { IProject } from "@/models/project.model";
import { updateProject, deleteProject } from "@/actions/project.actions";
import { toast } from "sonner";

interface ProjectActionsProps {
    project: IProject;
}

export function ProjectActions({ project }: ProjectActionsProps) {
    const router = useRouter();
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [editData, setEditData] = useState({
        name: project.name,
        description: project.description || "",
        startDate: project.startDate ? new Date(project.startDate).toISOString().split("T")[0] : "",
        deadline: project.deadline ? new Date(project.deadline).toISOString().split("T")[0] : "",
        tags: project.tags?.join(", ") || "",
    });

    const handleUpdate = async () => {
        startTransition(async () => {
            try {
                const result = await updateProject(project._id.toString(), {
                    name: editData.name,
                    description: editData.description,
                    startDate: editData.startDate,
                    deadline: editData.deadline,
                    tags: editData.tags.split(",").map((t) => t.trim()).filter(Boolean),
                });

                if (result.error) {
                    toast.error(result.error);
                } else {
                    toast.success("Project updated");
                    setIsEditOpen(false);
                    router.refresh();
                }
            } catch (error) {
                toast.error("Failed to update project");
            }
        });
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this project? This action cannot be undone.")) return;

        const toastId = toast.loading("Deleting project...");

        try {
            const result = await deleteProject(project._id.toString());
            if (result.error) {
                toast.error(result.error, { id: toastId });
            } else {
                toast.success("Project deleted", { id: toastId });
                router.push("/projects");
                router.refresh();
            }
        } catch (error) {
            toast.error("Failed to delete project", { id: toastId });
        }
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit Project
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50" onClick={handleDelete}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Project
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Edit Project</DialogTitle>
                        <DialogDescription>
                            Update project details.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="edit-name">Project Name</Label>
                            <Input
                                id="edit-name"
                                value={editData.name}
                                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-description">Description</Label>
                            <Input
                                id="edit-description"
                                value={editData.description}
                                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="edit-startDate">Start Date</Label>
                                <Input
                                    id="edit-startDate"
                                    type="date"
                                    value={editData.startDate}
                                    onChange={(e) => setEditData({ ...editData, startDate: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-deadline">Deadline</Label>
                                <Input
                                    id="edit-deadline"
                                    type="date"
                                    value={editData.deadline}
                                    onChange={(e) => setEditData({ ...editData, deadline: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-tags">Tags (comma-separated)</Label>
                            <Input
                                id="edit-tags"
                                value={editData.tags}
                                onChange={(e) => setEditData({ ...editData, tags: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleUpdate} disabled={isPending || !editData.name}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
