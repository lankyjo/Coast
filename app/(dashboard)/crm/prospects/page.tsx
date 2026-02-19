"use client";

import { useEffect, useCallback } from "react";
import { useProspectStore } from "@/stores/prospect.store";
import { getProspects } from "@/actions/prospect.actions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Search,
    LayoutGrid,
    List,
    Plus,
    ChevronLeft,
    ChevronRight,
    Star,
} from "lucide-react";
import Link from "next/link";
import type { Prospect, PipelineStage, ProspectCategory, Market } from "@/types/crm.types";

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    not_contacted: { label: "Not Contacted", variant: "secondary" },
    new_lead: { label: "New Lead", variant: "secondary" },
    contacted: { label: "Contacted", variant: "default" },
    follow_up: { label: "Follow-Up", variant: "default" },
    responded: { label: "Responded", variant: "outline" },
    discovery: { label: "Discovery", variant: "outline" },
    proposal_sent: { label: "Proposal Sent", variant: "outline" },
    negotiation: { label: "Negotiation", variant: "outline" },
    won: { label: "Won", variant: "default" },
    project_started: { label: "Started", variant: "default" },
    lost: { label: "Lost", variant: "destructive" },
    nurture: { label: "Nurture", variant: "secondary" },
};

function WeaknessScore({ score }: { score: number }) {
    const colors = ["", "text-green-500", "text-lime-500", "text-yellow-500", "text-orange-500", "text-red-500"];
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
                <Star
                    key={i}
                    className={`h-3.5 w-3.5 ${i <= score ? colors[score] : "text-muted-foreground/20"}`}
                    fill={i <= score ? "currentColor" : "none"}
                />
            ))}
        </div>
    );
}

export default function ProspectsPage() {
    const {
        prospects,
        total,
        page,
        totalPages,
        isLoading,
        viewMode,
        filters,
        sort,
        setProspects,
        setLoading,
        setViewMode,
        setFilters,
        setPage,
    } = useProspectStore();

    const loadProspects = useCallback(async () => {
        setLoading(true);
        try {
            const result = await getProspects({ filters, sort, page, limit: 25 });
            if (result.data) {
                setProspects(
                    result.data.prospects,
                    result.data.total,
                    result.data.page,
                    result.data.totalPages
                );
            }
        } catch (err) {
            console.error("Failed to load prospects:", err);
        } finally {
            setLoading(false);
        }
    }, [filters, sort, page, setProspects, setLoading]);

    useEffect(() => {
        loadProspects();
    }, [loadProspects]);

    if (isLoading && prospects.length === 0) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-8 w-48" />
                <div className="flex gap-3">
                    <Skeleton className="h-10 flex-1" />
                    <Skeleton className="h-10 w-32" />
                </div>
                {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Prospects</h1>
                    <p className="text-sm text-muted-foreground">
                        {total} prospects in database
                    </p>
                </div>
                <Link href="/crm/prospects/new">
                    <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add Prospect
                    </Button>
                </Link>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search prospects..."
                        className="pl-9"
                        value={filters.search}
                        onChange={(e) => setFilters({ search: e.target.value })}
                    />
                </div>

                <Select
                    value={filters.pipeline_stage}
                    onValueChange={(v) => setFilters({ pipeline_stage: v as PipelineStage | "all" })}
                >
                    <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Stage" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Stages</SelectItem>
                        {Object.entries(STATUS_BADGE).map(([key, val]) => (
                            <SelectItem key={key} value={key}>
                                {val.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    value={filters.category}
                    onValueChange={(v) => setFilters({ category: v as ProspectCategory | "all" })}
                >
                    <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {["Roofing", "Builders", "Landscaping", "Pools", "Real Estate", "Property Mgmt", "Auto Detail", "Cleaning", "Custom"].map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    value={filters.market}
                    onValueChange={(v) => setFilters({ market: v as Market | "all" })}
                >
                    <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Market" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Markets</SelectItem>
                        <SelectItem value="DFW">DFW</SelectItem>
                        <SelectItem value="North Alabama">North Alabama</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                </Select>

                <div className="flex items-center border rounded-md">
                    <Button
                        variant={viewMode === "list" ? "secondary" : "ghost"}
                        size="icon"
                        className="h-9 w-9 rounded-r-none"
                        onClick={() => setViewMode("list")}
                    >
                        <List className="h-4 w-4" />
                    </Button>
                    <Button
                        variant={viewMode === "card" ? "secondary" : "ghost"}
                        size="icon"
                        className="h-9 w-9 rounded-l-none"
                        onClick={() => setViewMode("card")}
                    >
                        <LayoutGrid className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Content */}
            {prospects.length === 0 ? (
                <Card className="border-0 shadow-sm">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <p className="text-muted-foreground text-center">
                            No prospects found. Try adjusting your filters or add a new prospect.
                        </p>
                    </CardContent>
                </Card>
            ) : viewMode === "list" ? (
                <Card className="border-0 shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Business</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Market</TableHead>
                                <TableHead>Weakness</TableHead>
                                <TableHead>Stage</TableHead>
                                <TableHead>Assigned</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {prospects.map((p) => (
                                <TableRow key={p._id} className="cursor-pointer hover:bg-muted/50">
                                    <TableCell>
                                        <Link href={`/crm/prospects/${p._id}`} className="block">
                                            <p className="font-medium">{p.business_name}</p>
                                            {p.owner_name && (
                                                <p className="text-xs text-muted-foreground">{p.owner_name}</p>
                                            )}
                                        </Link>
                                    </TableCell>
                                    <TableCell className="text-sm">{p.category}</TableCell>
                                    <TableCell className="text-sm">{p.market}</TableCell>
                                    <TableCell>
                                        <WeaknessScore score={p.weakness_score} />
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={STATUS_BADGE[p.pipeline_stage]?.variant || "secondary"}>
                                            {STATUS_BADGE[p.pipeline_stage]?.label || p.pipeline_stage}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {typeof p.assigned_to === "object" ? p.assigned_to.name : "—"}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Card>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {prospects.map((p) => (
                        <Link key={p._id} href={`/crm/prospects/${p._id}`}>
                            <Card className="border-0 shadow-sm transition-shadow hover:shadow-md cursor-pointer">
                                <CardContent className="p-4 space-y-3">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="font-semibold">{p.business_name}</h3>
                                            {p.owner_name && (
                                                <p className="text-xs text-muted-foreground">{p.owner_name}</p>
                                            )}
                                        </div>
                                        <Badge variant={STATUS_BADGE[p.pipeline_stage]?.variant || "secondary"} className="text-[10px]">
                                            {STATUS_BADGE[p.pipeline_stage]?.label || p.pipeline_stage}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-muted-foreground">{p.category} · {p.market}</span>
                                        <WeaknessScore score={p.weakness_score} />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {p.tags?.slice(0, 3).map((tag) => (
                                            <Badge key={tag} variant="outline" className="text-[10px]">
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        Page {page} of {totalPages} ({total} total)
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page <= 1}
                            onClick={() => setPage(page - 1)}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page >= totalPages}
                            onClick={() => setPage(page + 1)}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
