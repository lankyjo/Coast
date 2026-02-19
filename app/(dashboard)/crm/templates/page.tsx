"use client";

import { useEffect, useState } from "react";
import { getTemplates, deleteTemplate } from "@/actions/template.actions";
import { useTemplateStore } from "@/stores/template.store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Edit2, Mail, Zap } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import type { Template, TemplateCategory } from "@/types/crm.types";

const CATEGORY_COLORS: Record<string, string> = {
    "Cold Intro": "bg-blue-100 text-blue-700",
    "Follow-Up": "bg-indigo-100 text-indigo-700",
    "Value Add": "bg-green-100 text-green-700",
    "Case Study": "bg-purple-100 text-purple-700",
    "Re-Engagement": "bg-orange-100 text-orange-700",
    "Thank You": "bg-emerald-100 text-emerald-700",
    "Welcome": "bg-teal-100 text-teal-700",
    "Kickoff": "bg-cyan-100 text-cyan-700",
    "Custom": "bg-gray-100 text-gray-700",
};

export default function TemplatesPage() {
    const {
        templates,
        isLoading,
        filterCategory,
        filterAutoOnly,
        setTemplates,
        setLoading,
        setFilterCategory,
        setFilterAutoOnly,
        removeTemplate,
    } = useTemplateStore();

    useEffect(() => {
        loadTemplates();
    }, [filterCategory, filterAutoOnly]);

    async function loadTemplates() {
        setLoading(true);
        try {
            const filters: Record<string, unknown> = {};
            if (filterCategory !== "all") filters.category = filterCategory;
            if (filterAutoOnly) filters.is_auto_template = true;

            const result = await getTemplates(filters as any);
            if (result.data) setTemplates(result.data);
        } catch {
            console.error("Failed to load templates");
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Delete this template?")) return;
        try {
            const result = await deleteTemplate(id);
            if (result.success) {
                removeTemplate(id);
                toast.success("Template deleted");
            }
        } catch {
            toast.error("Failed to delete");
        }
    }

    if (isLoading && templates.length === 0) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-8 w-48" />
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-44 rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Email Templates</h1>
                    <p className="text-sm text-muted-foreground">
                        {templates.length} templates available
                    </p>
                </div>
                <Link href="/crm/templates/new">
                    <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        New Template
                    </Button>
                </Link>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <Select
                    value={filterCategory}
                    onValueChange={(v) => setFilterCategory(v as TemplateCategory | "all")}
                >
                    <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {Object.keys(CATEGORY_COLORS).map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Button
                    variant={filterAutoOnly ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterAutoOnly(!filterAutoOnly)}
                    className="gap-1.5"
                >
                    <Zap className="h-3.5 w-3.5" />
                    Auto Only
                </Button>
            </div>

            {/* Template Grid */}
            {templates.length === 0 ? (
                <Card className="border-0 shadow-sm">
                    <CardContent className="flex flex-col items-center py-16">
                        <Mail className="h-10 w-10 text-muted-foreground/30 mb-3" />
                        <p className="text-muted-foreground text-center">
                            No templates found. Create your first email template!
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {templates.map((template: Template) => (
                        <Card key={template._id} className="border-0 shadow-sm transition-shadow hover:shadow-md">
                            <CardContent className="p-4 space-y-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold truncate">{template.name}</h3>
                                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                                            Subject: {template.subject_line}
                                        </p>
                                    </div>
                                    {template.is_auto_template && (
                                        <Badge variant="secondary" className="text-[10px] gap-1 shrink-0">
                                            <Zap className="h-2.5 w-2.5" />
                                            Auto
                                        </Badge>
                                    )}
                                </div>

                                <Badge className={`text-[10px] ${CATEGORY_COLORS[template.category] || ""}`}>
                                    {template.category}
                                </Badge>

                                <p className="text-xs text-muted-foreground line-clamp-2">
                                    {template.body.replace(/<[^>]*>/g, "").substring(0, 100)}...
                                </p>

                                <div className="flex items-center justify-between pt-1">
                                    <span className="text-[11px] text-muted-foreground">
                                        by {typeof template.created_by === "object" ? template.created_by.name : "—"}
                                    </span>
                                    <div className="flex gap-1">
                                        <Link href={`/crm/templates/${template._id}`}>
                                            <Button variant="ghost" size="icon" className="h-7 w-7">
                                                <Edit2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </Link>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-destructive"
                                            onClick={() => handleDelete(template._id)}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
