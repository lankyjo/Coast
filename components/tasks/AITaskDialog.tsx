"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { generateTaskFromInput } from "@/actions/ai.actions";
import { Sparkles, Loader2 } from "lucide-react";

interface AITaskDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onTaskGenerated: (taskData: any) => void;
}

export function AITaskDialog({ open, onOpenChange, onTaskGenerated }: AITaskDialogProps) {
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!input.trim()) return;

        setIsLoading(true);
        setError(null);

        try {
            const result = await generateTaskFromInput(input);
            if (result.success && result.data) {
                onTaskGenerated(result.data);
                onOpenChange(false);
                setInput("");
            } else {
                setError(result.error || "Failed to generate task");
            }
        } catch (e) {
            setError("Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        Create with AI
                    </DialogTitle>
                    <DialogDescription>
                        Describe your task in natural language. AI will structure it for you.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    <Textarea
                        placeholder="e.g. 'Redesign the landing page hero section. Needs new copy, better specific CTA, and optimized images. High priority due by Friday.'"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="min-h-[120px]"
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleGenerate();
                            }
                        }}
                    />
                    {error && (
                        <p className="text-sm text-destructive">{error}</p>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleGenerate} disabled={isLoading || !input.trim()}>
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Sparkles className="mr-2 h-4 w-4" />
                                Generate Task
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
