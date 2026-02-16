"use client";

import { useState } from "react";
import { generateEODReport } from "@/actions/ai.actions";
import { AIEODReport } from "@/types/ai.types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Sparkles, AlertCircle, FileText, Download } from "lucide-react";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export function AIEODReportGenerator() {
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState<AIEODReport | null>(null);

    const handleGenerateReport = async () => {
        setLoading(true);
        try {
            const result = await generateEODReport();
            if (result.success && result.data) {
                setReport(result.data);
                toast.success("EOD Report generated successfully");
            } else {
                toast.error(result.error || "Failed to generate report");
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handleCopyReport = () => {
        if (!report) return;
        const text = `EOD Report - ${new Date(report.date).toLocaleDateString()}\n\nSummary:\n${report.summary}\n\nTeam Updates:\n${report.memberReports.map(m => `\n${m.memberName}:\n- Completed: ${m.tasksCompleted} tasks\n- In Progress: ${m.tasksInProgress} tasks\n- Highlights: ${m.highlights.join(", ")}\n- Blockers: ${m.blockers.join(", ") || "None"}`).join("\n")}`;
        navigator.clipboard.writeText(text);
        toast.success("Report copied to clipboard");
    };

    return (
        <Card className="h-full border-blue-100 shadow-sm">
            <CardHeader className="bg-slate-50/50 pb-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Sparkles className="h-5 w-5 text-blue-600" />
                            AI End-of-Day Report
                        </CardTitle>
                        <CardDescription>
                            Generate a summary of today's team activity and progress.
                        </CardDescription>
                    </div>
                    <div className="flex gap-2">
                        {report && (
                            <Button variant="outline" size="sm" onClick={handleCopyReport}>
                                <FileText className="mr-2 h-4 w-4" />
                                Copy Text
                            </Button>
                        )}
                        <Button onClick={handleGenerateReport} disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="mr-2 h-4 w-4" />
                                    Generate Report
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-6">
                {!report ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground border-2 border-dashed rounded-lg bg-slate-50/50">
                        <Sparkles className="h-10 w-10 text-blue-200 mb-3" />
                        <h3 className="font-semibold text-lg text-slate-700">No Report Generated</h3>
                        <p className="max-w-sm mt-1">
                            Click "Generate Report" to analyze team activity, completed tasks, and blockers for today.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6 animate-in fade-in-50">
                        {/* Executive Summary */}
                        <div className="rounded-lg bg-blue-50 p-4 border border-blue-100">
                            <h3 className="font-semibold text-blue-900 mb-1 flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Executive Summary
                            </h3>
                            <p className="text-blue-800 text-sm leading-relaxed">
                                {report.summary}
                            </p>
                            <div className="mt-3 flex gap-4 text-xs font-medium text-blue-700">
                                <div>Total Members: {report.memberReports.length}</div>
                                <div>Date: {new Date(report.date).toLocaleDateString()}</div>
                            </div>
                        </div>

                        <Separator />

                        {/* Member Updates */}
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {report.memberReports.map((member, idx) => (
                                <Card key={idx} className="overflow-hidden border-slate-200 shadow-none">
                                    <div className="bg-slate-50 px-3 py-2 border-b font-medium text-sm flex items-center justify-between">
                                        {member.memberName}
                                        {member.blockers.length > 0 && (
                                            <Badge variant="destructive" className="h-5 text-[10px] px-1.5">Blocked</Badge>
                                        )}
                                    </div>
                                    <div className="p-3 text-sm space-y-3">
                                        <div className="grid grid-cols-2 gap-2 text-center mb-2">
                                            <div className="bg-green-50 rounded p-1 border border-green-100">
                                                <div className="text-lg font-bold text-green-700">{member.tasksCompleted}</div>
                                                <div className="text-[10px] text-green-600 uppercase tracking-wide">Done</div>
                                            </div>
                                            <div className="bg-amber-50 rounded p-1 border border-amber-100">
                                                <div className="text-lg font-bold text-amber-700">{member.tasksInProgress}</div>
                                                <div className="text-[10px] text-amber-600 uppercase tracking-wide">Active</div>
                                            </div>
                                        </div>

                                        {member.highlights.length > 0 && (
                                            <div>
                                                <span className="text-xs font-semibold text-slate-600 uppercase tracking-tight block mb-1">
                                                    Highlights
                                                </span>
                                                <ul className="list-disc list-inside space-y-0.5 text-slate-600 text-xs">
                                                    {member.highlights.map((h, i) => (
                                                        <li key={i} className="line-clamp-2" title={h}>{h}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {member.blockers.length > 0 && (
                                            <div className="rounded bg-red-50 p-2 text-xs text-red-700 border border-red-100">
                                                <span className="font-semibold block mb-0.5">Blockers:</span>
                                                <ul className="list-disc list-inside space-y-0.5">
                                                    {member.blockers.map((b, i) => (
                                                        <li key={i}>{b}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
