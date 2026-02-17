"use client";

import { useEffect, useState, useCallback } from "react";
import {
    startTimeEntry,
    stopTimeEntry,
    getRunningTimer,
    getTaskTimeLogs
} from "@/actions/time.actions";
import { Button } from "@/components/ui/button";
import { Clock, Play, Square, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface TimeTrackerProps {
    taskId: string;
    projectId: string;
}

export function TimeTracker({ taskId, projectId }: TimeTrackerProps) {
    const [runningLog, setRunningLog] = useState<any>(null);
    const [totalSeconds, setTotalSeconds] = useState(0);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        try {
            const [running, logs] = await Promise.all([
                getRunningTimer(taskId),
                getTaskTimeLogs(taskId)
            ]);

            setRunningLog(running);

            const total = logs.reduce((acc: number, log: any) => acc + (log.duration || 0), 0);
            setTotalSeconds(total);

            if (running) {
                const start = new Date(running.startTime).getTime();
                const now = new Date().getTime();
                setElapsedSeconds(Math.floor((now - start) / 1000));
            }
        } catch (error) {
            console.error("Failed to load time data", error);
        } finally {
            setLoading(false);
        }
    }, [taskId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Timer heartbeat
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (runningLog) {
            interval = setInterval(() => {
                const start = new Date(runningLog.startTime).getTime();
                const now = new Date().getTime();
                setElapsedSeconds(Math.floor((now - start) / 1000));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [runningLog]);

    const handleStart = async () => {
        try {
            const log = await startTimeEntry(taskId, projectId);
            setRunningLog(log);
            toast.success("Timer started");
        } catch (error: any) {
            toast.error(error.message || "Failed to start timer");
        }
    };

    const handleStop = async () => {
        try {
            if (!runningLog) return;
            const stoppedLog = await stopTimeEntry(runningLog._id);
            setTotalSeconds(prev => prev + stoppedLog.duration);
            setRunningLog(null);
            setElapsedSeconds(0);
            toast.success("Timer stopped. Time logged.");
        } catch (error: any) {
            toast.error(error.message || "Failed to stop timer");
        }
    };

    const formatSeconds = (total: number) => {
        const hours = Math.floor(total / 3600);
        const minutes = Math.floor((total % 3600) / 60);
        const seconds = total % 60;

        const parts = [];
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0 || hours > 0) parts.push(`${minutes}m`);
        parts.push(`${seconds}s`);

        return parts.join(" ");
    };

    if (loading) return <div className="animate-pulse h-10 w-full bg-muted rounded" />;

    return (
        <div className="flex flex-col gap-4 p-4 border rounded-lg bg-card">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Time Tracking</span>
                </div>
                <Badge variant="outline" className="font-mono">
                    Total: {formatSeconds(totalSeconds)}
                </Badge>
            </div>

            <div className="flex items-center gap-2">
                {runningLog ? (
                    <>
                        <div className="flex-1 px-3 py-2 bg-primary/10 rounded border border-primary/20 flex items-center justify-between">
                            <span className="text-base font-mono font-bold text-primary animate-pulse">
                                {formatSeconds(elapsedSeconds)}
                            </span>
                            <span className="text-xs text-primary uppercase font-medium">Active</span>
                        </div>
                        <Button variant="destructive" size="icon" onClick={handleStop}>
                            <Square className="h-4 w-4" />
                        </Button>
                    </>
                ) : (
                    <>
                        <Button
                            variant="outline"
                            className="flex-1 justify-start gap-2 h-10"
                            onClick={handleStart}
                        >
                            <Play className="h-4 w-4 fill-current" />
                            Start Timer
                        </Button>
                        <Button variant="ghost" size="icon" title="Add manual entry">
                            <Plus className="h-4 w-4" />
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
}
