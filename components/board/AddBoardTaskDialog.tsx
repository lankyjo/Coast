"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { CreateTaskForm } from "@/components/tasks/CreateTaskForm";

interface AddBoardTaskDialogProps {
    boardId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AddBoardTaskDialog({ boardId, open, onOpenChange }: AddBoardTaskDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-lg font-bold">
                        Add Task to Board
                    </DialogTitle>
                </DialogHeader>

                <CreateTaskForm
                    boardId={boardId}
                    onSuccess={() => onOpenChange(false)}
                    onCancel={() => onOpenChange(false)}
                />
            </DialogContent>
        </Dialog>
    );
}
