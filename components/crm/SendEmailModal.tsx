"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Send, Info, Loader2 } from "lucide-react";
import { getTemplates, sendTemplateEmail } from "@/actions/template.actions";
import { toast } from "sonner";
import type { Template, Prospect } from "@/types/crm.types";

interface SendEmailModalProps {
    open: boolean;
    onClose: () => void;
    prospect: Prospect;
}

const MERGE_TAGS = [
    { tag: "{{owner_name}}", label: "Owner Name" },
    { tag: "{{business_name}}", label: "Business Name" },
    { tag: "{{category}}", label: "Category" },
    { tag: "{{assigned_to_name}}", label: "Assigned To" },
];

export default function SendEmailModal({ open, onClose, prospect }: SendEmailModalProps) {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState("");
    const [customSubject, setCustomSubject] = useState("");
    const [customBody, setCustomBody] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);

    useEffect(() => {
        if (open) loadTemplates();
    }, [open]);

    async function loadTemplates() {
        setIsLoadingTemplates(true);
        try {
            const result = await getTemplates();
            if (result.data) setTemplates(result.data);
        } catch {
            console.error("Failed to load templates");
        } finally {
            setIsLoadingTemplates(false);
        }
    }

    function handleTemplateSelect(templateId: string) {
        setSelectedTemplateId(templateId);
        const template = templates.find((t) => t._id === templateId);
        if (template) {
            setCustomSubject(template.subject_line);
            setCustomBody(template.body);
        }
    }

    function previewMergeTags(text: string): string {
        return text
            .replace(/\{\{owner_name\}\}/g, prospect.owner_name || "there")
            .replace(/\{\{business_name\}\}/g, prospect.business_name)
            .replace(/\{\{category\}\}/g, prospect.category)
            .replace(
                /\{\{assigned_to_name\}\}/g,
                typeof prospect.assigned_to === "object" ? prospect.assigned_to.name : "The Coast Team"
            );
    }

    async function handleSend() {
        if (!selectedTemplateId) {
            toast.error("Select a template");
            return;
        }
        if (!prospect.email) {
            toast.error("This prospect has no email address");
            return;
        }

        setIsSending(true);
        try {
            const result = await sendTemplateEmail({
                template_id: selectedTemplateId,
                prospect_id: prospect._id,
                customSubject: customSubject || undefined,
                customBody: customBody || undefined,
            });

            if (result.success) {
                toast.success(`Email sent to ${prospect.email}`);
                onClose();
                setSelectedTemplateId("");
                setCustomSubject("");
                setCustomBody("");
            } else if (result.error) {
                toast.error(result.error);
            }
        } catch {
            toast.error("Failed to send email");
        } finally {
            setIsSending(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Send Email to {prospect.business_name}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Recipient */}
                    <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3">
                        <span className="text-sm text-muted-foreground">To:</span>
                        <span className="text-sm font-medium">
                            {prospect.email || (
                                <span className="text-destructive">No email on file</span>
                            )}
                        </span>
                        {prospect.owner_name && (
                            <span className="text-xs text-muted-foreground">
                                ({prospect.owner_name})
                            </span>
                        )}
                    </div>

                    {/* Template Selector */}
                    <div className="space-y-2">
                        <Label>Email Template</Label>
                        <Select
                            value={selectedTemplateId}
                            onValueChange={handleTemplateSelect}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={isLoadingTemplates ? "Loading..." : "Choose a template"} />
                            </SelectTrigger>
                            <SelectContent>
                                {templates.map((t) => (
                                    <SelectItem key={t._id} value={t._id}>
                                        <div className="flex items-center gap-2">
                                            <span>{t.name}</span>
                                            <Badge variant="outline" className="text-[9px]">
                                                {t.category}
                                            </Badge>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Subject */}
                    {selectedTemplateId && (
                        <>
                            <div className="space-y-2">
                                <Label>Subject Line</Label>
                                <Input
                                    value={customSubject}
                                    onChange={(e) => setCustomSubject(e.target.value)}
                                    placeholder="Email subject..."
                                />
                                {customSubject && (
                                    <p className="text-xs text-muted-foreground">
                                        Preview: {previewMergeTags(customSubject)}
                                    </p>
                                )}
                            </div>

                            {/* Body */}
                            <div className="space-y-2">
                                <Label>Email Body</Label>
                                <Textarea
                                    value={customBody}
                                    onChange={(e) => setCustomBody(e.target.value)}
                                    rows={10}
                                    className="font-mono text-sm"
                                />
                            </div>

                            {/* Merge Tags */}
                            <div className="rounded-lg bg-muted/50 p-3 space-y-2">
                                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                    <Info className="h-3.5 w-3.5" />
                                    Merge Tags (click to insert)
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {MERGE_TAGS.map(({ tag, label }) => (
                                        <button
                                            key={tag}
                                            type="button"
                                            className="rounded bg-background px-2 py-1 text-[10px] font-mono border hover:bg-primary/5 transition-colors"
                                            onClick={() => setCustomBody((b) => b + tag)}
                                        >
                                            {tag}
                                            <span className="ml-1 text-muted-foreground not-italic font-sans">
                                                {label}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSend}
                        disabled={isSending || !selectedTemplateId || !prospect.email}
                        className="gap-2"
                    >
                        {isSending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                        {isSending ? "Sending..." : "Send Email"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
