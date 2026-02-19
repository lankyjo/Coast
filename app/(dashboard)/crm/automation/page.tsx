"use client";

import { useEffect, useState } from "react";
import {
    getAutomationConfigs,
    updateAutomationConfig,
    seedAutomationConfigs,
} from "@/actions/automation.actions";
import { getTemplates } from "@/actions/template.actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    ArrowLeft,
    Zap,
    RefreshCw,
    Settings,
    AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import type { Template } from "@/types/crm.types";

interface AutomationConfig {
    _id: string;
    trigger_name: string;
    display_name: string;
    description: string;
    enabled: boolean;
    template_id?: string;
    delay_days: number;
    target_categories: string[];
    createdAt: string;
    updatedAt: string;
}

export default function AutomationSettingsPage() {
    const [configs, setConfigs] = useState<AutomationConfig[]>([]);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [savingId, setSavingId] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setIsLoading(true);
        try {
            const [configsResult, templatesResult] = await Promise.all([
                getAutomationConfigs(),
                getTemplates({ is_auto_template: true }),
            ]);

            if (configsResult.data) setConfigs(configsResult.data);
            if (templatesResult.data) setTemplates(templatesResult.data);
        } catch {
            console.error("Failed to load automation data");
        } finally {
            setIsLoading(false);
        }
    }

    async function handleSeedDefaults() {
        try {
            const result = await seedAutomationConfigs();
            if (result.success) {
                toast.success("Default automation configs seeded");
                loadData();
            }
        } catch {
            toast.error("Failed to seed configs");
        }
    }

    async function handleToggle(configId: string, enabled: boolean) {
        setSavingId(configId);
        try {
            const result = await updateAutomationConfig(configId, { enabled });
            if (result.data) {
                setConfigs((prev) =>
                    prev.map((c) => (c._id === configId ? { ...c, enabled } : c))
                );
                toast.success(enabled ? "Automation enabled" : "Automation disabled");
            }
        } catch {
            toast.error("Failed to update");
        } finally {
            setSavingId(null);
        }
    }

    async function handleUpdateTemplate(configId: string, templateId: string) {
        setSavingId(configId);
        try {
            const result = await updateAutomationConfig(configId, {
                template_id: templateId,
            });
            if (result.data) {
                setConfigs((prev) =>
                    prev.map((c) =>
                        c._id === configId ? { ...c, template_id: templateId } : c
                    )
                );
                toast.success("Template updated");
            }
        } catch {
            toast.error("Failed to update");
        } finally {
            setSavingId(null);
        }
    }

    async function handleUpdateDelay(configId: string, delayDays: number) {
        setSavingId(configId);
        try {
            const result = await updateAutomationConfig(configId, {
                delay_days: delayDays,
            });
            if (result.data) {
                setConfigs((prev) =>
                    prev.map((c) =>
                        c._id === configId ? { ...c, delay_days: delayDays } : c
                    )
                );
                toast.success("Delay updated");
            }
        } catch {
            toast.error("Failed to update");
        } finally {
            setSavingId(null);
        }
    }

    if (isLoading) {
        return (
            <div className="space-y-6 max-w-3xl">
                <Skeleton className="h-8 w-48" />
                {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-40 rounded-xl" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-3xl">
            <div className="flex items-center justify-between">
                <div>
                    <Link
                        href="/crm"
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to CRM
                    </Link>
                    <h1 className="text-2xl font-bold tracking-tight">Automation Settings</h1>
                    <p className="text-sm text-muted-foreground">
                        Configure automated follow-ups and thank-you emails
                    </p>
                </div>
            </div>

            {/* Info Banner */}
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-sm text-blue-700">
                    <p className="font-medium mb-1">How Automations Work</p>
                    <ul className="space-y-1 text-xs text-blue-600">
                        <li>• <strong>Follow-ups</strong> are processed on-demand via the CRM Dashboard button</li>
                        <li>• <strong>Thank-yous</strong> fire automatically when a prospect changes to the configured stage</li>
                        <li>• Emails are rate-limited to 5 per run to respect Resend free tier</li>
                        <li>• Assign an auto template to each rule for it to send</li>
                    </ul>
                </div>
            </div>

            {/* Seed Default Configs */}
            {configs.length === 0 && (
                <Card className="border-0 shadow-sm">
                    <CardContent className="flex flex-col items-center py-12">
                        <Settings className="h-10 w-10 text-muted-foreground/30 mb-3" />
                        <p className="text-sm text-muted-foreground mb-4">
                            No automation configs found. Seed defaults to get started.
                        </p>
                        <Button onClick={handleSeedDefaults} className="gap-2">
                            <RefreshCw className="h-4 w-4" />
                            Seed Default Configs
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Config Cards */}
            {configs.map((config) => {
                const linkedTemplate = templates.find(
                    (t) => t._id === config.template_id
                );

                return (
                    <Card key={config._id} className="border-0 shadow-sm">
                        <CardContent className="p-5 space-y-4">
                            {/* Header */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`rounded-lg p-2 ${config.enabled
                                                ? "bg-green-50"
                                                : "bg-muted"
                                            }`}
                                    >
                                        <Zap
                                            className={`h-4 w-4 ${config.enabled
                                                    ? "text-green-600"
                                                    : "text-muted-foreground"
                                                }`}
                                        />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold">
                                            {config.display_name || config.trigger_name}
                                        </h3>
                                        <p className="text-xs text-muted-foreground">
                                            {config.description || `Trigger: ${config.trigger_name}`}
                                        </p>
                                    </div>
                                </div>
                                <Switch
                                    checked={config.enabled}
                                    disabled={savingId === config._id}
                                    onCheckedChange={(checked) =>
                                        handleToggle(config._id, checked)
                                    }
                                />
                            </div>

                            {/* Settings */}
                            <div className="grid gap-4 sm:grid-cols-2 border-t pt-4">
                                {/* Template */}
                                <div className="space-y-2">
                                    <Label className="text-xs">Linked Template</Label>
                                    <Select
                                        value={config.template_id || ""}
                                        onValueChange={(v) =>
                                            handleUpdateTemplate(config._id, v)
                                        }
                                    >
                                        <SelectTrigger className="text-sm">
                                            <SelectValue placeholder="Select auto template" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {templates.map((t) => (
                                                <SelectItem key={t._id} value={t._id}>
                                                    {t.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {!config.template_id && (
                                        <p className="text-[10px] text-destructive">
                                            No template assigned — emails won't send
                                        </p>
                                    )}
                                </div>

                                {/* Delay */}
                                <div className="space-y-2">
                                    <Label className="text-xs">Delay (days)</Label>
                                    <Input
                                        type="number"
                                        min={0}
                                        max={90}
                                        value={config.delay_days}
                                        onChange={(e) =>
                                            handleUpdateDelay(
                                                config._id,
                                                parseInt(e.target.value) || 0
                                            )
                                        }
                                        className="text-sm"
                                    />
                                    <p className="text-[10px] text-muted-foreground">
                                        Days after trigger before email sends
                                    </p>
                                </div>
                            </div>

                            {/* Status */}
                            <div className="flex items-center gap-2">
                                <Badge
                                    variant={config.enabled ? "default" : "secondary"}
                                    className="text-[10px]"
                                >
                                    {config.enabled ? "Active" : "Disabled"}
                                </Badge>
                                {linkedTemplate && (
                                    <Badge variant="outline" className="text-[10px]">
                                        {linkedTemplate.name}
                                    </Badge>
                                )}
                                {config.target_categories.length > 0 && (
                                    <Badge variant="outline" className="text-[10px]">
                                        {config.target_categories.join(", ")}
                                    </Badge>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
