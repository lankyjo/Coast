"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getProspect, updateProspect, deleteProspect } from "@/actions/prospect.actions";
import { getActivitiesForProspect, logActivity } from "@/actions/crm-activity.actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    ArrowLeft,
    Mail,
    Phone,
    Globe,
    MapPin,
    Star,
    Edit2,
    Trash2,
    Save,
    X,
    MessageSquare,
    PhoneCall,
    Calendar,
    StickyNote,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";
import type { Prospect, CrmActivity, CrmActivityType, ActivityOutcome } from "@/types/crm.types";

const STAGE_COLORS: Record<string, string> = {
    new_lead: "bg-gray-100 text-gray-700",
    contacted: "bg-blue-100 text-blue-700",
    follow_up: "bg-blue-50 text-blue-600",
    responded: "bg-green-100 text-green-700",
    discovery: "bg-yellow-100 text-yellow-700",
    proposal_sent: "bg-indigo-100 text-indigo-700",
    negotiation: "bg-purple-100 text-purple-700",
    won: "bg-emerald-100 text-emerald-700",
    project_started: "bg-teal-100 text-teal-700",
    lost: "bg-red-100 text-red-700",
    nurture: "bg-amber-100 text-amber-700",
};

const ACTIVITY_ICONS: Record<string, any> = {
    email_sent: Mail,
    call_made: PhoneCall,
    call_received: PhoneCall,
    email_received: Mail,
    note_added: StickyNote,
    meeting: Calendar,
    follow_up_sent: Mail,
    auto_follow_up: Mail,
    auto_thank_you: Mail,
    stage_changed: Star,
    other: MessageSquare,
};

export default function ProspectDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [prospect, setProspect] = useState<Prospect | null>(null);
    const [activities, setActivities] = useState<CrmActivity[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<Partial<Prospect>>({});
    const [activityForm, setActivityForm] = useState({
        show: false,
        type: "note_added" as CrmActivityType,
        subject: "",
        details: "",
    });

    useEffect(() => {
        loadData();
    }, [id]);

    async function loadData() {
        setIsLoading(true);
        try {
            const [prospectResult, activitiesResult] = await Promise.all([
                getProspect(id),
                getActivitiesForProspect(id),
            ]);

            if (prospectResult.data) {
                setProspect(prospectResult.data);
                setEditData(prospectResult.data);
            }
            if (activitiesResult.data) setActivities(activitiesResult.data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleSave() {
        try {
            const result = await updateProspect(id, editData as any);
            if (result.data) {
                setProspect(result.data);
                setIsEditing(false);
                toast.success("Prospect updated");
            } else if (result.error) {
                toast.error(result.error);
            }
        } catch {
            toast.error("Failed to save");
        }
    }

    async function handleDelete() {
        if (!confirm("Delete this prospect? This cannot be undone.")) return;
        try {
            const result = await deleteProspect(id);
            if (result.success) {
                toast.success("Prospect deleted");
                router.push("/crm/prospects");
            }
        } catch {
            toast.error("Failed to delete");
        }
    }

    async function handleLogActivity() {
        if (!activityForm.subject.trim()) return;
        try {
            const result = await logActivity({
                prospect_id: id,
                activity_type: activityForm.type,
                subject: activityForm.subject,
                details: activityForm.details,
            });
            if (result.data) {
                setActivities((prev) => [result.data, ...prev]);
                setActivityForm({ show: false, type: "note_added", subject: "", details: "" });
                toast.success("Activity logged");
            }
        } catch {
            toast.error("Failed to log activity");
        }
    }

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-32" />
                <div className="grid gap-6 md:grid-cols-3">
                    <Skeleton className="h-96 md:col-span-2 rounded-xl" />
                    <Skeleton className="h-96 rounded-xl" />
                </div>
            </div>
        );
    }

    if (!prospect) {
        return (
            <div className="text-center py-16">
                <p className="text-muted-foreground">Prospect not found</p>
                <Link href="/crm/prospects">
                    <Button variant="link">Back to Prospects</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Back + Actions */}
            <div className="flex items-center justify-between">
                <Link href="/crm/prospects" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Prospects
                </Link>
                <div className="flex gap-2">
                    {isEditing ? (
                        <>
                            <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                                <X className="h-4 w-4 mr-1" /> Cancel
                            </Button>
                            <Button size="sm" onClick={handleSave}>
                                <Save className="h-4 w-4 mr-1" /> Save
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                                <Edit2 className="h-4 w-4 mr-1" /> Edit
                            </Button>
                            <Button variant="destructive" size="sm" onClick={handleDelete}>
                                <Trash2 className="h-4 w-4 mr-1" /> Delete
                            </Button>
                        </>
                    )}
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Main Info */}
                <Card className="border-0 shadow-sm md:col-span-2">
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div>
                                <CardTitle className="text-xl">{prospect.business_name}</CardTitle>
                                {prospect.owner_name && (
                                    <p className="text-sm text-muted-foreground mt-1">{prospect.owner_name}</p>
                                )}
                            </div>
                            <Badge className={STAGE_COLORS[prospect.pipeline_stage] || ""}>
                                {prospect.pipeline_stage.replace(/_/g, " ")}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-3 sm:grid-cols-2">
                            {prospect.email && (
                                <div className="flex items-center gap-2 text-sm">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <a href={`mailto:${prospect.email}`} className="text-primary hover:underline">{prospect.email}</a>
                                </div>
                            )}
                            {prospect.phone && (
                                <div className="flex items-center gap-2 text-sm">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    {prospect.phone}
                                </div>
                            )}
                            {prospect.website && (
                                <div className="flex items-center gap-2 text-sm">
                                    <Globe className="h-4 w-4 text-muted-foreground" />
                                    <a href={prospect.website} target="_blank" className="text-primary hover:underline truncate">{prospect.website}</a>
                                </div>
                            )}
                            {prospect.address && (
                                <div className="flex items-center gap-2 text-sm">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    {prospect.address}
                                </div>
                            )}
                        </div>

                        <Separator />

                        <div className="grid gap-4 sm:grid-cols-3">
                            <div>
                                <p className="text-xs text-muted-foreground font-medium">Category</p>
                                <p className="text-sm font-medium">{prospect.category}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground font-medium">Market</p>
                                <p className="text-sm font-medium">{prospect.market}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground font-medium">Weakness Score</p>
                                <div className="flex items-center gap-1 mt-0.5">
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <Star key={i} className={`h-4 w-4 ${i <= prospect.weakness_score ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground/20"}`} />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {prospect.weakness_notes && (
                            <div>
                                <p className="text-xs text-muted-foreground font-medium mb-1">Weakness Notes</p>
                                <p className="text-sm bg-muted/50 rounded-lg p-3">{prospect.weakness_notes}</p>
                            </div>
                        )}

                        {prospect.notes && (
                            <div>
                                <p className="text-xs text-muted-foreground font-medium mb-1">General Notes</p>
                                <p className="text-sm bg-muted/50 rounded-lg p-3">{prospect.notes}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Sidebar - Status & Meta */}
                <div className="space-y-4">
                    <Card className="border-0 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-sm">Status</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Contacted</span>
                                <Badge variant={prospect.contacted ? "default" : "secondary"}>
                                    {prospect.contacted ? "Yes" : "No"}
                                </Badge>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Responded</span>
                                <Badge variant={prospect.responded ? "default" : "secondary"}>
                                    {prospect.responded ? "Yes" : "No"}
                                </Badge>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Deal Closed</span>
                                <Badge variant={prospect.deal_closed ? "default" : "secondary"}>
                                    {prospect.deal_closed ? "Yes" : "No"}
                                </Badge>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Source</span>
                                <span>{prospect.lead_source}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Assigned</span>
                                <span>{typeof prospect.assigned_to === "object" ? prospect.assigned_to.name : "—"}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {prospect.tags && prospect.tags.length > 0 && (
                        <Card className="border-0 shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-sm">Tags</CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-wrap gap-1.5">
                                {prospect.tags.map((tag) => (
                                    <Badge key={tag} variant="outline" className="text-xs">
                                        {tag}
                                    </Badge>
                                ))}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {/* Activity Timeline */}
            <Card className="border-0 shadow-sm">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Activity Timeline</CardTitle>
                        <div className="flex gap-2">
                            {[
                                { label: "Log Call", type: "call_made", icon: PhoneCall },
                                { label: "Log Email", type: "email_sent", icon: Mail },
                                { label: "Add Note", type: "note_added", icon: StickyNote },
                                { label: "Log Meeting", type: "meeting", icon: Calendar },
                            ].map((btn) => (
                                <Button
                                    key={btn.type}
                                    variant="outline"
                                    size="sm"
                                    className="text-xs gap-1"
                                    onClick={() =>
                                        setActivityForm({
                                            show: true,
                                            type: btn.type as CrmActivityType,
                                            subject: "",
                                            details: "",
                                        })
                                    }
                                >
                                    <btn.icon className="h-3 w-3" />
                                    {btn.label}
                                </Button>
                            ))}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Quick Add Form */}
                    {activityForm.show && (
                        <div className="mb-4 rounded-lg border p-4 space-y-3">
                            <Input
                                placeholder="Subject (e.g. 'Cold intro call')"
                                value={activityForm.subject}
                                onChange={(e) =>
                                    setActivityForm((f) => ({ ...f, subject: e.target.value }))
                                }
                            />
                            <Input
                                placeholder="Details (optional)"
                                value={activityForm.details}
                                onChange={(e) =>
                                    setActivityForm((f) => ({ ...f, details: e.target.value }))
                                }
                            />
                            <div className="flex gap-2 justify-end">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        setActivityForm({ show: false, type: "note_added", subject: "", details: "" })
                                    }
                                >
                                    Cancel
                                </Button>
                                <Button size="sm" onClick={handleLogActivity}>
                                    Log Activity
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Timeline */}
                    {activities.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                            No activity logged yet
                        </p>
                    ) : (
                        <div className="space-y-4">
                            {activities.map((activity) => {
                                const Icon = ACTIVITY_ICONS[activity.activity_type] || MessageSquare;
                                return (
                                    <div key={activity._id} className="flex gap-3">
                                        <div className="mt-1 rounded-full bg-muted p-1.5 shrink-0">
                                            <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-medium">{activity.subject}</p>
                                                {activity.is_automated && (
                                                    <Badge variant="secondary" className="text-[9px]">Auto</Badge>
                                                )}
                                            </div>
                                            {activity.details && (
                                                <p className="text-xs text-muted-foreground mt-0.5">{activity.details}</p>
                                            )}
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {typeof activity.performed_by === "object" && activity.performed_by.name} ·{" "}
                                                {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
