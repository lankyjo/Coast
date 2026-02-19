"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { updateMemberExpertise } from "@/actions/admin.actions";
import { EXPERTISE_OPTIONS } from "@/constants/expertise";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { MultiSelect } from "@/components/ui/multi-select";

interface UpdateExpertiseDialogProps {
    userId: string;
    currentExpertise: string[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: (userId: string, expertise: string[]) => void;
}

export function UpdateExpertiseDialog({
    userId,
    currentExpertise,
    open,
    onOpenChange,
    onSuccess,
}: UpdateExpertiseDialogProps) {
    const [expertise, setExpertise] = useState<string[]>(currentExpertise || []);
    const [isLoading, setIsLoading] = useState(false);

    // Re-sync local state when the dialog opens for a different user
    useEffect(() => {
        if (open) {
            setExpertise(currentExpertise || []);
        }
    }, [open, userId, currentExpertise]);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const result = await updateMemberExpertise(userId, expertise);

            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Expertise updated successfully");
                onSuccess?.(userId, expertise);
                onOpenChange(false);
            }
        } catch (error) {
            toast.error("Failed to update expertise");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Update Expertise</DialogTitle>
                    <DialogDescription>
                        Set the primary expertise for this team member.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleUpdate}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="expertise" className="text-right">
                                Expertise
                            </Label>
                            <div className="col-span-3">
                                <MultiSelect
                                    options={EXPERTISE_OPTIONS.map((opt) => ({
                                        label: opt,
                                        value: opt,
                                    }))}
                                    selected={expertise}
                                    onChange={setExpertise}
                                    placeholder="Select expertise"
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
