"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createTemplate } from "@/actions/template.actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, Info } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import type { TemplateCategory } from "@/types/crm.types";

const MERGE_TAGS = [
    "{{owner_name}}",
    "{{business_name}}",
    "{{category}}",
    "{{assigned_to_name}}",
];

export default function NewTemplatePage() {
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);
    const [form, setForm] = useState({
        name: "",
        subject_line: "",
        body: "",
        category: "Custom" as TemplateCategory,
        target_industry: "",
        is_auto_template: false,
        auto_trigger: "",
        tags: "",
    });

    function updateField(field: string, value: string | boolean) {
        setForm((prev) => ({ ...prev, [field]: value }));
    }

    async function handleSave() {
        if (!form.name.trim() || !form.subject_line.trim() || !form.body.trim()) {
            toast.error("Name, subject, and body are required");
            return;
        }

        setIsSaving(true);
        try {
            const result = await createTemplate({
                name: form.name.trim(),
                subject_line: form.subject_line.trim(),
                body: form.body.trim(),
                category: form.category,
                target_industry: form.target_industry.trim() || undefined,
                is_auto_template: form.is_auto_template,
                auto_trigger: form.auto_trigger.trim() || undefined,
                tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
            });

            if (result.success) {
                toast.success("Template created");
                router.push("/crm/templates");
            } else if (result.error) {
                toast.error(result.error);
            }
        } catch {
            toast.error("Failed to create template");
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <div className="space-y-6 max-w-3xl">
            <div className="flex items-center justify-between">
                <Link href="/crm/templates" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Templates
                </Link>
                <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                    <Save className="h-4 w-4" />
                    {isSaving ? "Saving..." : "Save Template"}
                </Button>
            </div>

            <Card className="border-0 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg">Create Email Template</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Template Name *</Label>
                            <Input
                                value={form.name}
                                onChange={(e) => updateField("name", e.target.value)}
                                placeholder="e.g. Cold Intro - Roofing"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Category</Label>
                            <Select value={form.category} onValueChange={(v) => updateField("category", v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {["Cold Intro", "Follow-Up", "Value Add", "Case Study", "Re-Engagement", "Thank You", "Welcome", "Kickoff", "Custom"].map((c) => (
                                        <SelectItem key={c} value={c}>{c}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Subject Line *</Label>
                        <Input
                            value={form.subject_line}
                            onChange={(e) => updateField("subject_line", e.target.value)}
                            placeholder="e.g. {{business_name}}, your online presence needs attention"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Email Body *</Label>
                        <Textarea
                            value={form.body}
                            onChange={(e) => updateField("body", e.target.value)}
                            placeholder="Write your email template here. Use merge tags below to personalize."
                            rows={12}
                            className="font-mono text-sm"
                        />
                    </div>

                    {/* Merge Tags Help */}
                    <div className="rounded-lg bg-muted/50 p-3 space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                            <Info className="h-4 w-4 text-muted-foreground" />
                            Available Merge Tags
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {MERGE_TAGS.map((tag) => (
                                <button
                                    key={tag}
                                    type="button"
                                    className="rounded bg-background px-2 py-1 text-[11px] font-mono border hover:bg-primary/5 transition-colors"
                                    onClick={() => {
                                        updateField("body", form.body + tag);
                                    }}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Auto Template Toggle */}
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div>
                            <p className="text-sm font-medium">Auto Template</p>
                            <p className="text-xs text-muted-foreground">
                                Enable this for automated follow-up or thank-you sequences
                            </p>
                        </div>
                        <Switch
                            checked={form.is_auto_template}
                            onCheckedChange={(checked) => updateField("is_auto_template", checked)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Tags (comma-separated)</Label>
                        <Input
                            value={form.tags}
                            onChange={(e) => updateField("tags", e.target.value)}
                            placeholder="roofing, cold-outreach"
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
