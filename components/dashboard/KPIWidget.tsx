"use client";

import { useEffect } from "react";
import { useKPIStore } from "@/stores/kpi.store";
import {
    CheckCircle2,
    Clock,
    TrendingUp,
    AlertCircle,
    Zap,
    Trophy
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function KPIWidget() {
    const { kpis, isLoading, fetchKPIs } = useKPIStore();

    useEffect(() => {
        fetchKPIs();
    }, [fetchKPIs]);

    if (isLoading && !kpis) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="p-4 rounded-2xl border bg-card">
                        <Skeleton className="h-4 w-1/2 mb-2" />
                        <Skeleton className="h-8 w-full" />
                    </div>
                ))}
            </div>
        );
    }

    if (!kpis) return null;

    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (hours === 0) return `${minutes}m`;
        return `${hours}h ${minutes}m`;
    };

    const cards = [
        {
            label: "Done Today",
            value: kpis.tasksDoneToday,
            icon: CheckCircle2,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
        },
        {
            label: "Week Total",
            value: kpis.tasksDoneThisWeek,
            icon: Trophy,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
        },
        {
            label: "Completion Rate",
            value: `${kpis.completionRate}%`,
            icon: TrendingUp,
            color: "text-purple-500",
            bg: "bg-purple-500/10",
        },
        {
            label: "Time Logged",
            value: formatTime(kpis.totalTimeSpentToday),
            icon: Clock,
            color: "text-amber-500",
            bg: "bg-amber-500/10",
        },
        {
            label: "Overdue",
            value: kpis.overdueTasksCount,
            icon: AlertCircle,
            color: kpis.overdueTasksCount > 0 ? "text-red-500" : "text-neutral-400",
            bg: kpis.overdueTasksCount > 0 ? "bg-red-500/10" : "bg-neutral-500/5",
        },
        {
            label: "Active Streak",
            value: `${kpis.activeStreak} days`,
            icon: Zap,
            color: "text-orange-500",
            bg: "bg-orange-500/10",
        },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {cards.map((card, i) => (
                <div
                    key={i}
                    className="group relative overflow-hidden p-4 rounded-2xl border bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm transition-all hover:shadow-lg hover:-translate-y-1"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <div className={cn("p-1.5 rounded-lg", card.bg)}>
                            <card.icon className={cn("w-3.5 h-3.5", card.color)} />
                        </div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            {card.label}
                        </span>
                    </div>
                    <div className="text-xl font-bold tracking-tight">
                        {card.value}
                    </div>

                    {/* Subtle design element */}
                    <div className={cn(
                        "absolute -right-2 -bottom-2 w-12 h-12 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity",
                        card.color
                    )}>
                        <card.icon className="w-full h-full" />
                    </div>
                </div>
            ))}
        </div>
    );
}
