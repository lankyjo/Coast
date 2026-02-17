"use client";

import { useEffect, useState } from "react";
import { getRecentActivity } from "@/actions/activity.actions";
import { formatDistanceToNow } from "date-fns";
import {
    PlusCircle,
    CheckCircle2,
    UserPlus,
    FileUp,
    ClipboardList,
    MessageSquare,
    Clock,
    AlertCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

interface Activity {
    _id: string;
    userId: {
        name: string;
        email: string;
        image?: string;
    };
    action: string;
    description: string;
    projectId?: {
        name: string;
    };
    metadata?: {
        taskId?: {
            title: string;
        };
    };
    createdAt: string;
}

export function ActivityFeed() {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadActivity() {
            try {
                const data = await getRecentActivity(15);
                setActivities(data);
            } catch (error) {
                console.error("Failed to load activities", error);
            } finally {
                setLoading(false);
            }
        }
        loadActivity();
    }, []);

    const getIcon = (action: string) => {
        switch (action) {
            case "task_created": return <PlusCircle className="h-4 w-4 text-blue-500" />;
            case "task_completed": return <CheckCircle2 className="h-4 w-4 text-green-500" />;
            case "task_assigned": return <UserPlus className="h-4 w-4 text-purple-500" />;
            case "project_created": return <ClipboardList className="h-4 w-4 text-orange-500" />;
            case "comment_added": return <MessageSquare className="h-4 w-4 text-sky-500" />;
            case "status_changed": return <Clock className="h-4 w-4 text-yellow-500" />;
            case "time_logged": return <AlertCircle className="h-4 w-4 text-pink-500" />;
            default: return <PlusCircle className="h-4 w-4 text-gray-500" />;
        }
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center space-x-4">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <div className="space-y-1">
                                <Skeleton className="h-4 w-[200px]" />
                                <Skeleton className="h-3 w-[150px]" />
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0">
                <ScrollArea className="h-[400px] px-6">
                    <div className="space-y-6 pb-6">
                        {activities.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-8">
                                No recent activity found.
                            </p>
                        ) : (
                            activities.map((activity) => (
                                <div key={activity._id} className="flex gap-3">
                                    <div className="mt-0.5 rounded-full p-1 bg-muted">
                                        {getIcon(activity.action)}
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="text-sm">
                                            <span className="font-medium text-foreground">
                                                {activity.userId?.name || "Someone"}
                                            </span>{" "}
                                            <span className="text-muted-foreground">
                                                {activity.description}
                                            </span>
                                            {activity.projectId && (
                                                <Badge variant="outline" className="ml-2 text-[10px] h-4">
                                                    {activity.projectId.name}
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-[11px] text-muted-foreground font-light">
                                            {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
