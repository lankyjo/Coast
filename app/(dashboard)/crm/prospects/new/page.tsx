"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProspect } from "@/actions/prospect.actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function NewProspectPage() {
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);
    const [form, setForm] = useState({
        business_name: "",
        owner_name: "",
        email: "",
        phone: "",
        website: "",
        address: "",
        market: "Other",
        category: "Custom",
        rating_score: 3,
        rating_notes: "",
        google_rating: "",
        review_count: "",
        social_facebook: "",
        social_instagram: "",
        social_linkedin: "",
        est_revenue: "",
        est_employees: "",
        notes: "",
        tags: "",
    });

    function updateField(field: string, value: string | number) {
        setForm((prev) => ({ ...prev, [field]: value }));
    }

    async function handleSave() {
        if (!form.business_name.trim()) {
            toast.error("Business name is required");
            return;
        }

        setIsSaving(true);
        try {
            const result = await createProspect({
                business_name: form.business_name.trim(),
                owner_name: form.owner_name.trim() || undefined,
                email: form.email.trim() || undefined,
                phone: form.phone.trim() || undefined,
                website: form.website.trim() || undefined,
                address: form.address.trim() || undefined,
                market: form.market as any,
                category: form.category as any,
                rating_score: form.rating_score,
                rating_notes: form.rating_notes.trim() || undefined,
                google_rating: form.google_rating ? parseFloat(form.google_rating) : undefined,
                review_count: form.review_count ? parseInt(form.review_count) : undefined,
                social_facebook: form.social_facebook.trim() || undefined,
                social_instagram: form.social_instagram.trim() || undefined,
                social_linkedin: form.social_linkedin.trim() || undefined,
                est_revenue: form.est_revenue.trim() || undefined,
                est_employees: form.est_employees.trim() || undefined,
                notes: form.notes.trim() || undefined,
                tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
            } as any);

            if (result.success) {
                toast.success("Prospect created");
                router.push("/crm/prospects");
            } else if (result.error) {
                toast.error(result.error);
            }
        } catch {
            toast.error("Failed to create prospect");
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <div className="space-y-6 max-w-3xl">
            <div className="flex items-center justify-between">
                <Link href="/crm/prospects" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Prospects
                </Link>
                <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                    <Save className="h-4 w-4" />
                    {isSaving ? "Saving..." : "Save Prospect"}
                </Button>
            </div>

            <Card className="border-0 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg">Add New Prospect</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Basic Info */}
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Business Name *</Label>
                            <Input
                                value={form.business_name}
                                onChange={(e) => updateField("business_name", e.target.value)}
                                placeholder="Company name"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Owner / Contact Name</Label>
                            <Input
                                value={form.owner_name}
                                onChange={(e) => updateField("owner_name", e.target.value)}
                                placeholder="John Doe"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input
                                type="email"
                                value={form.email}
                                onChange={(e) => updateField("email", e.target.value)}
                                placeholder="contact@company.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Phone</Label>
                            <Input
                                value={form.phone}
                                onChange={(e) => updateField("phone", e.target.value)}
                                placeholder="(555) 123-4567"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Website</Label>
                            <Input
                                value={form.website}
                                onChange={(e) => updateField("website", e.target.value)}
                                placeholder="https://..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Address</Label>
                            <Input
                                value={form.address}
                                onChange={(e) => updateField("address", e.target.value)}
                                placeholder="City, State"
                            />
                        </div>
                    </div>

                    {/* Classification */}
                    <div className="grid gap-4 sm:grid-cols-3">
                        <div className="space-y-2">
                            <Label>Market</Label>
                            <Select value={form.market} onValueChange={(v) => updateField("market", v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="DFW">DFW</SelectItem>
                                    <SelectItem value="North Alabama">North Alabama</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Category</Label>
                            <Select value={form.category} onValueChange={(v) => updateField("category", v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {["Roofing", "Builders", "Landscaping", "Pools", "Real Estate", "Property Mgmt", "Auto Detail", "Cleaning", "Custom"].map((c) => (
                                        <SelectItem key={c} value={c}>{c}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Rating Score (1-5)</Label>
                            <Select value={String(form.rating_score)} onValueChange={(v) => updateField("rating_score", parseInt(v))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <SelectItem key={i} value={String(i)}>
                                            {i} — {["Minimal", "Low", "Medium", "High", "Critical"][i - 1]}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label>Rating Notes</Label>
                        <Textarea
                            value={form.rating_notes}
                            onChange={(e) => updateField("rating_notes", e.target.value)}
                            placeholder="What branding ratings did you identify?"
                            rows={3}
                        />
                    </div>

                    {/* Online Presence */}
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Google Rating</Label>
                            <Input
                                type="number"
                                step="0.1"
                                min="0"
                                max="5"
                                value={form.google_rating}
                                onChange={(e) => updateField("google_rating", e.target.value)}
                                placeholder="4.5"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Review Count</Label>
                            <Input
                                type="number"
                                value={form.review_count}
                                onChange={(e) => updateField("review_count", e.target.value)}
                                placeholder="42"
                            />
                        </div>
                    </div>

                    {/* Tags */}
                    <div className="space-y-2">
                        <Label>Tags (comma-separated)</Label>
                        <Input
                            value={form.tags}
                            onChange={(e) => updateField("tags", e.target.value)}
                            placeholder="high-priority, follow-up, referral"
                        />
                    </div>

                    {/* General Notes */}
                    <div className="space-y-2">
                        <Label>General Notes</Label>
                        <Textarea
                            value={form.notes}
                            onChange={(e) => updateField("notes", e.target.value)}
                            placeholder="Any additional info about this prospect..."
                            rows={3}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
