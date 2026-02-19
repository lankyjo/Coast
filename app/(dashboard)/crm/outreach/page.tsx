"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, TrendingUp, Mail, Reply, AlertCircle } from "lucide-react";
import Link from "next/link";
import {
    getTemplatePerformanceStats,
    getOutreachStats,
} from "@/actions/template.actions";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
} from "recharts";

const PIE_COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

export default function OutreachDashboard() {
    const [templateStats, setTemplateStats] = useState<any[]>([]);
    const [outreachStats, setOutreachStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    async function loadStats() {
        setIsLoading(true);
        try {
            const [tStats, oStats] = await Promise.all([
                getTemplatePerformanceStats(),
                getOutreachStats(),
            ]);
            if (tStats.data) setTemplateStats(tStats.data);
            if (oStats.data) setOutreachStats(oStats.data);
        } catch (err) {
            console.error("Failed to load outreach stats:", err);
        } finally {
            setIsLoading(false);
        }
    }

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-48" />
                <div className="grid gap-4 md:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-24 rounded-xl" />
                    ))}
                </div>
                <Skeleton className="h-80 rounded-xl" />
            </div>
        );
    }

    const weekData = outreachStats?.thisWeek || { total: 0, manual: 0, auto: 0, replies: 0 };
    const monthData = outreachStats?.thisMonth || { total: 0, manual: 0, auto: 0, replies: 0 };

    const summaryCards = [
        {
            title: "Sent This Week",
            value: weekData.total,
            icon: Mail,
            color: "text-blue-600",
            bg: "bg-blue-50",
        },
        {
            title: "Replies This Week",
            value: weekData.replies,
            icon: Reply,
            color: "text-green-600",
            bg: "bg-green-50",
        },
        {
            title: "Weekly Reply Rate",
            value: `${outreachStats?.weeklyReplyRate || 0}%`,
            icon: TrendingUp,
            color: "text-indigo-600",
            bg: "bg-indigo-50",
        },
        {
            title: "Sent This Month",
            value: monthData.total,
            icon: Mail,
            color: "text-purple-600",
            bg: "bg-purple-50",
        },
    ];

    // Bar chart data
    const barData = templateStats.map((t) => ({
        name: t.name?.length > 15 ? t.name.substring(0, 15) + "…" : t.name,
        "Total Sends": t.totalSends,
        Replies: t.replyCount,
    }));

    // Pie chart data
    const pieData = templateStats
        .filter((t) => t.totalSends > 0)
        .map((t) => ({
            name: t.name,
            value: t.totalSends,
        }));

    return (
        <div className="space-y-6">
            <div>
                <Link
                    href="/crm"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-2"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to CRM
                </Link>
                <h1 className="text-2xl font-bold tracking-tight">Outreach Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                    Email performance analytics and template tracking
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {summaryCards.map((card) => (
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

            <div className="grid gap-6 md:grid-cols-2">
                {/* Template Performance Bar Chart */}
                <Card className="border-0 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base">Template Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {barData.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                <AlertCircle className="h-8 w-8 mb-2 opacity-30" />
                                <p className="text-sm">No send data yet</p>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={barData}>
                                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 11 }} />
                                    <Tooltip />
                                    <Bar dataKey="Total Sends" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="Replies" fill="#22c55e" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                {/* Send Distribution Pie Chart */}
                <Card className="border-0 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base">Send Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {pieData.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                <AlertCircle className="h-8 w-8 mb-2 opacity-30" />
                                <p className="text-sm">No send data yet</p>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        outerRadius={100}
                                        fill="#6366f1"
                                        dataKey="value"
                                        label={({ name, percent }) =>
                                            `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`
                                        }
                                    >
                                        {pieData.map((_, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={PIE_COLORS[index % PIE_COLORS.length]}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Template Stats Table */}
            {templateStats.length > 0 && (
                <Card className="border-0 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base">Template Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {templateStats.map((t: any) => (
                                <div
                                    key={t.templateId}
                                    className="flex items-center justify-between rounded-lg border p-3"
                                >
                                    <div>
                                        <p className="text-sm font-medium">{t.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {t.manualSends} manual · {t.autoSends} auto ·
                                            Last used{" "}
                                            {t.lastUsed
                                                ? new Date(t.lastUsed).toLocaleDateString()
                                                : "never"}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3 text-right">
                                        <div>
                                            <p className="text-sm font-semibold">{t.totalSends}</p>
                                            <p className="text-[10px] text-muted-foreground">Sends</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold">
                                                {t.replyRate?.toFixed(0) || 0}%
                                            </p>
                                            <p className="text-[10px] text-muted-foreground">Reply Rate</p>
                                        </div>
                                        <Badge
                                            variant={
                                                t.replyRate >= 20
                                                    ? "default"
                                                    : t.replyRate >= 10
                                                        ? "secondary"
                                                        : "outline"
                                            }
                                            className="text-[10px]"
                                        >
                                            {t.replyRate >= 20
                                                ? "Strong"
                                                : t.replyRate >= 10
                                                    ? "Average"
                                                    : "Low"}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Manual vs Auto breakdown */}
            <Card className="border-0 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-base">Manual vs Automated</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="rounded-lg bg-indigo-50 p-4">
                            <p className="text-xs text-indigo-600 font-medium mb-1">This Week</p>
                            <div className="flex items-center gap-4">
                                <div>
                                    <p className="text-xl font-bold text-indigo-700">{weekData.manual}</p>
                                    <p className="text-[10px] text-indigo-500">Manual</p>
                                </div>
                                <div>
                                    <p className="text-xl font-bold text-indigo-700">{weekData.auto}</p>
                                    <p className="text-[10px] text-indigo-500">Automated</p>
                                </div>
                            </div>
                        </div>
                        <div className="rounded-lg bg-purple-50 p-4">
                            <p className="text-xs text-purple-600 font-medium mb-1">This Month</p>
                            <div className="flex items-center gap-4">
                                <div>
                                    <p className="text-xl font-bold text-purple-700">{monthData.manual}</p>
                                    <p className="text-[10px] text-purple-500">Manual</p>
                                </div>
                                <div>
                                    <p className="text-xl font-bold text-purple-700">{monthData.auto}</p>
                                    <p className="text-[10px] text-purple-500">Automated</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
