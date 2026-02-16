"use client";

import { useState } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { generateDailyKeyPoints } from "@/actions/ai.actions";
import { AIDailyKeyPoint } from "@/types/ai.types";
import { toast } from "sonner";

export function AIKeyPointsCard() {
    const [loading, setLoading] = useState(false);
    const [keyPoints, setKeyPoints] = useState<AIDailyKeyPoint[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await generateDailyKeyPoints();
            if (result.success && result.data) {
                setKeyPoints(result.data.keyPoints);
            } else {
                setError(result.error || "Failed to generate insights");
                toast.error("Failed to generate insights");
            }
        } catch (e) {
            setError("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const PRIORITY_COLORS = {
        high: "text-red-600 bg-red-50 border-red-200",
        medium: "text-amber-600 bg-amber-50 border-amber-200",
        low: "text-blue-600 bg-blue-50 border-blue-200",
    };

    if (error) {
        return (
            <Card className="border-red-200 bg-red-50/20">
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-red-700">
                        <AlertCircle className="h-5 w-5" />
                        AI Insights Failed
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-red-600 mb-3">{error}</p>
                    <Button variant="outline" size="sm" onClick={handleGenerate} disabled={loading}>
                        <RefreshCw className={`mr-2 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                        Retry
                    </Button>
                </CardContent>
            </Card>
        );
    }

    if (!keyPoints) {
        return (
            <Card className="bg-linear-to-br from-indigo-50 to-purple-50 border-indigo-100">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-indigo-900">
                            <Sparkles className="h-5 w-5 text-indigo-600" />
                            Daily Key Points
                        </CardTitle>
                    </div>
                    <CardDescription className="text-indigo-700/80">
                        Get AI-powered insights on what needs attention today.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button
                        onClick={handleGenerate}
                        disabled={loading}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white w-full sm:w-auto"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Analyzing Projects...
                            </>
                        ) : (
                            <>
                                <Sparkles className="mr-2 h-4 w-4" />
                                Generate Insights
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-indigo-100 shadow-sm">
            <CardHeader className="pb-3 border-b bg-slate-50/50">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Sparkles className="h-5 w-5 text-indigo-600" />
                            Daily Focus
                        </CardTitle>
                        <CardDescription>
                            AI-prioritized action items for {new Date().toLocaleDateString()}
                        </CardDescription>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleGenerate}
                        disabled={loading}
                        title="Refresh Insights"
                    >
                        <RefreshCw className={`h-4 w-4 text-muted-foreground ${loading ? "animate-spin" : ""}`} />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="pt-4 grid gap-3">
                {keyPoints.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">No key points generated.</p>
                ) : (
                    keyPoints.map((point, idx) => (
                        <div
                            key={idx}
                            className={`rounded-lg border p-3 flex gap-3 items-start ${PRIORITY_COLORS[point.priority] || "bg-slate-50"}`}
                        >
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/50 text-xs font-bold ring-1 ring-black/5">
                                {idx + 1}
                            </span>
                            <div className="space-y-1">
                                <p className="text-sm font-semibold leading-none">
                                    {point.title}
                                </p>
                                <p className="text-xs opacity-90 leading-relaxed">
                                    {point.description}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </CardContent>
        </Card>
    );
}
