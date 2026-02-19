"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Users,
    Phone,
    MessageSquare,
    Trophy,
    Rocket,
    TrendingUp,
    ArrowRight,
    RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { getProspectStats } from "@/actions/prospect.actions";
import { getRecentActivities } from "@/actions/crm-activity.actions";
import { processFollowUpsNow } from "@/actions/automation.actions";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export default function CrmDashboard() {
    const [stats, setStats] = useState<any>(null);
    const [activities, setActivities] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setIsLoading(true);
        try {
            const [statsResult, activitiesResult] = await Promise.all([
                getProspectStats(),
                getRecentActivities(),
            ]);

            if (statsResult.data) setStats(statsResult.data);
            if (activitiesResult.data) setActivities(activitiesResult.data);
        } catch (err) {
            console.error("Failed to load CRM dashboard:", err);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleProcessFollowUps() {
        setIsProcessing(true);
        try {
            const result = await processFollowUpsNow();
            if (result.data) {
                toast.success(
                    `Follow-ups processed: ${result.data.sent} sent, ${result.data.skipped} skipped`
                );
                if (result.data.errors.length > 0) {
                    toast.error(`${result.data.errors.length} errors occurred`);
                }
            } else if (result.error) {
                toast.error(result.error);
            }
        } catch {
            toast.error("Failed to process follow-ups");
        } finally {
            setIsProcessing(false);
        }
    }

    const statCards = [
        {
            title: "Total Prospects",
            value: stats?.total || 0,
            icon: Users,
            color: "text-blue-600",
            bg: "bg-blue-50",
        },
        {
            title: "Contacted",
            value: stats?.contacted || 0,
            icon: Phone,
            color: "text-indigo-600",
            bg: "bg-indigo-50",
        },
        {
            title: "Responded",
            value: stats?.responded || 0,
            icon: MessageSquare,
            color: "text-green-600",
            bg: "bg-green-50",
        },
        {
            title: "Deals Won",
            value: stats?.deals_won || 0,
            icon: Trophy,
            color: "text-purple-600",
            bg: "bg-purple-50",
        },
        {
            title: "Projects Started",
            value: stats?.projects_started || 0,
            icon: Rocket,
            color: "text-teal-600",
            bg: "bg-teal-50",
        },
        {
            title: "Conversion Rate",
            value: `${stats?.conversion_rate || 0}%`,
            icon: TrendingUp,
            color: "text-orange-600",
            bg: "bg-orange-50",
        },
    ];

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-10 w-40" />
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Skeleton key={i} className="h-28 rounded-xl" />
                    ))}
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                    <Skeleton className="h-80 rounded-xl" />
                    <Skeleton className="h-80 rounded-xl" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">CRM Dashboard</h1>
                    <p className="text-sm text-muted-foreground">
                        Manage your sales pipeline and outreach
                    </p>
                </div>
                <Button
                    onClick={handleProcessFollowUps}
                    disabled={isProcessing}
                    variant="outline"
                    className="gap-2"
                >
                    <RefreshCw className={`h-4 w-4 ${isProcessing ? "animate-spin" : ""}`} />
                    {isProcessing ? "Processing..." : "Process Follow-Ups"}
                </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {statCards.map((card) => (
                    <Card key={card.title} className="border-0 shadow-sm">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className={`rounded-lg p-2 ${card.bg}`}>
                                    <card.icon className={`h-4 w-4 ${card.color}`} />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{card.value}</p>
                                    <p className="text-[11px] text-muted-foreground font-medium">
                                        {card.title}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Quick Links + Recent Activity */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Quick Links */}
                <Card className="border-0 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-2">
                        {[
                            { label: "View All Prospects", href: "/crm/prospects", desc: `${stats?.total || 0} leads in database` },
                            { label: "Sales Pipeline", href: "/crm/pipeline", desc: "Kanban board view" },
                            { label: "Email Templates", href: "/crm/templates", desc: "Manage outreach templates" },
                            { label: "Import CSV", href: "/crm/import", desc: "Bulk import prospects" },
                        ].map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                            >
                                <div>
                                    <p className="text-sm font-medium">{link.label}</p>
                                    <p className="text-xs text-muted-foreground">{link.desc}</p>
                                </div>
                                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            </Link>
                        ))}
                    </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card className="border-0 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base">Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {activities.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-8">
                                No activity yet. Start by adding prospects!
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {activities.slice(0, 8).map((activity: any) => (
                                    <div
                                        key={activity._id}
                                        className="flex items-start gap-3 text-sm"
                                    >
                                        <div className="mt-0.5 h-2 w-2 rounded-full bg-primary shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">
                                                {activity.subject}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {activity.prospect_id?.business_name &&
                                                    `${activity.prospect_id.business_name} · `}
                                                {formatDistanceToNow(
                                                    new Date(activity.createdAt),
                                                    { addSuffix: true }
                                                )}
                                            </p>
                                        </div>
                                        {activity.is_automated && (
                                            <Badge variant="secondary" className="text-[10px] shrink-0">
                                                Auto
                                            </Badge>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Pipeline Stage Summary */}
            {stats?.stages && Object.keys(stats.stages).length > 0 && (
                <Card className="border-0 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base">Pipeline Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-3">
                            {Object.entries(stats.stages).map(([stage, count]) => (
                                <div
                                    key={stage}
                                    className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2"
                                >
                                    <span className="text-xs font-medium capitalize">
                                        {stage.replace(/_/g, " ")}
                                    </span>
                                    <Badge variant="secondary" className="text-xs">
                                        {count as number}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
