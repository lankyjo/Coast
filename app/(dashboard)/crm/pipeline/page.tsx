"use client";

import { useEffect, useState } from "react";
import { usePipelineStore, STAGE_LABELS, ALL_STAGES } from "@/stores/pipeline.store";
import { getProspectsByStage } from "@/actions/pipeline.actions";
import { changeStage } from "@/actions/pipeline.actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, AlertTriangle, Clock } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import type { Prospect, PipelineStage } from "@/types/crm.types";

const STAGE_HEADER_COLORS: Record<string, string> = {
    new_lead: "border-t-gray-400",
    contacted: "border-t-blue-500",
    follow_up: "border-t-blue-400",
    responded: "border-t-green-500",
    discovery: "border-t-yellow-500",
    proposal_sent: "border-t-indigo-500",
    negotiation: "border-t-purple-500",
    won: "border-t-emerald-500",
    project_started: "border-t-teal-500",
    lost: "border-t-red-500",
    nurture: "border-t-amber-500",
};

export default function PipelinePage() {
    const { columns, isLoading, setColumns, setLoading, moveProspect } = usePipelineStore();
    const [draggedProspect, setDraggedProspect] = useState<{
        id: string;
        fromStage: PipelineStage;
    } | null>(null);

    useEffect(() => {
        loadPipeline();
    }, []);

    async function loadPipeline() {
        setLoading(true);
        try {
            const result = await getProspectsByStage();
            if (result.data) {
                setColumns(result.data);
            }
        } catch (err) {
            console.error("Failed to load pipeline:", err);
        } finally {
            setLoading(false);
        }
    }

    function handleDragStart(e: React.DragEvent, prospectId: string, fromStage: PipelineStage) {
        setDraggedProspect({ id: prospectId, fromStage });
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", prospectId);
    }

    function handleDragOver(e: React.DragEvent) {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    }

    async function handleDrop(e: React.DragEvent, toStage: PipelineStage) {
        e.preventDefault();

        if (!draggedProspect || draggedProspect.fromStage === toStage) {
            setDraggedProspect(null);
            return;
        }

        // Optimistic update
        moveProspect(draggedProspect.id, draggedProspect.fromStage, toStage);

        try {
            const result = await changeStage(draggedProspect.id, toStage);
            if (result.error) {
                toast.error(result.error);
                // Revert on error
                moveProspect(draggedProspect.id, toStage, draggedProspect.fromStage);
            } else {
                toast.success(`Moved to ${STAGE_LABELS[toStage]}`);
            }
        } catch {
            toast.error("Failed to change stage");
            moveProspect(draggedProspect.id, toStage, draggedProspect.fromStage);
        }

        setDraggedProspect(null);
    }

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-8 w-48" />
                <div className="flex gap-4 overflow-x-auto">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-96 w-72 shrink-0 rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 overflow-hidden">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Sales Pipeline</h1>
                    <p className="text-sm text-muted-foreground">
                        Drag prospects between stages to update their status
                    </p>
                </div>
            </div>

            {/* Summary Bar */}
            <div className="flex flex-wrap gap-2">
                {columns.map((col) => (
                    <div
                        key={col.stage}
                        className="flex items-center gap-1.5 rounded-md bg-muted/50 px-2.5 py-1"
                    >
                        <span className="text-xs font-medium">{col.label}</span>
                        <Badge variant="secondary" className="text-[10px] h-4 px-1">
                            {col.prospects.length}
                        </Badge>
                    </div>
                ))}
            </div>

            {/* Kanban Board — scrolls horizontally within page only */}
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
                {columns.map((col) => (
                    <div
                        key={col.stage}
                        className={`flex flex-col w-72 shrink-0 rounded-xl bg-muted/30 border-t-2 ${STAGE_HEADER_COLORS[col.stage] || "border-t-gray-300"}`}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, col.stage)}
                    >
                        <div className="flex items-center justify-between p-3 pb-2">
                            <h3 className="text-sm font-semibold">{col.label}</h3>
                            <Badge variant="outline" className="text-[10px]">
                                {col.prospects.length}
                            </Badge>
                        </div>

                        <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-2 max-h-[calc(100vh-280px)]">
                            {col.prospects.length === 0 ? (
                                <div className="flex items-center justify-center h-20 rounded-lg border border-dashed text-xs text-muted-foreground">
                                    Drop here
                                </div>
                            ) : (
                                col.prospects.map((prospect: Prospect) => {
                                    const daysSinceUpdate = Math.floor(
                                        (Date.now() - new Date(prospect.updatedAt).getTime()) /
                                        (1000 * 60 * 60 * 24)
                                    );

                                    return (
                                        <div
                                            key={prospect._id}
                                            draggable
                                            onDragStart={(e) =>
                                                handleDragStart(e, prospect._id, col.stage)
                                            }
                                            className="cursor-grab active:cursor-grabbing rounded-lg bg-background p-3 shadow-sm border border-transparent hover:border-primary/20 transition-all"
                                        >
                                            <div className="space-y-2">
                                                <div className="flex items-start justify-between">
                                                    <Link href={`/crm/prospects/${prospect._id}`}>
                                                        <h4 className="text-sm font-medium leading-tight hover:underline text-primary">
                                                            {prospect.business_name}
                                                        </h4>
                                                    </Link>
                                                    {daysSinceUpdate >= 14 ? (
                                                        <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                                                    ) : daysSinceUpdate >= 7 ? (
                                                        <Clock className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                                                    ) : null}
                                                </div>
                                                <div className="flex items-center justify-between pointer-events-none">
                                                    <span className="text-[11px] text-muted-foreground">
                                                        {prospect.category}
                                                    </span>
                                                    <div className="flex items-center gap-0.5">
                                                        {[1, 2, 3, 4, 5].map((i) => (
                                                            <Star
                                                                key={i}
                                                                className={`h-2.5 w-2.5 ${i <= prospect.rating_score
                                                                    ? "text-yellow-500 fill-yellow-500"
                                                                    : "text-muted-foreground/20"
                                                                    }`}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between pointer-events-none">
                                                    <span className="text-[11px] text-muted-foreground">
                                                        {typeof prospect.assigned_to === "object"
                                                            ? prospect.assigned_to.name
                                                            : "—"}
                                                    </span>
                                                    {daysSinceUpdate > 0 && (
                                                        <span className="text-[10px] text-muted-foreground">
                                                            {daysSinceUpdate}d
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
