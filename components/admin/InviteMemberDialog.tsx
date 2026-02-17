"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { inviteMember } from "@/actions/invite.actions";
import { Loader2, Plus, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { EXPERTISE_OPTIONS } from "@/constants/expertise";
import { MultiSelect } from "@/components/ui/multi-select";

export function InviteMemberDialog() {
    const [open, setOpen] = useState(false);
    const [email, setEmail] = useState("");
    const [role, setRole] = useState<"admin" | "member">("member");
    const [expertise, setExpertise] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [inviteUrl, setInviteUrl] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setInviteUrl(null);

        try {
            const result = await inviteMember({ email, role, expertise });

            if (result.error) {
                toast.error(result.error);
            } else if (result.inviteUrl) {
                setInviteUrl(result.inviteUrl);
                toast.success("Invite link generated!");
            }
        } catch (error) {
            toast.error("Failed to create invitation");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = async () => {
        if (!inviteUrl) return;
        try {
            await navigator.clipboard.writeText(inviteUrl);
            setCopied(true);
            toast.success("Link copied to clipboard!");
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error("Failed to copy link");
        }
    };

    const handleClose = (isOpen: boolean) => {
        setOpen(isOpen);
        if (!isOpen) {
            // Reset state on close
            setEmail("");
            setRole("member");
            setExpertise([]);
            setInviteUrl(null);
            setCopied(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Invite Member
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Invite Team Member</DialogTitle>
                    <DialogDescription>
                        Generate a one-time invite link to share with your team member.
                    </DialogDescription>
                </DialogHeader>

                {!inviteUrl ? (
                    <form onSubmit={handleInvite}>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="email" className="text-right">
                                    Email
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="col-span-3"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="role" className="text-right">
                                    Role
                                </Label>
                                <Select
                                    value={role}
                                    onValueChange={(val: "admin" | "member") =>
                                        setRole(val)
                                    }
                                >
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="member">Member</SelectItem>
                                        <SelectItem value="admin">Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="expertise" className="text-right">
                                    Expertise
                                </Label>
                                <div className="col-span-3">
                                    <MultiSelect
                                        options={EXPERTISE_OPTIONS.map((opt) => ({
                                            label: opt,
                                            value: opt,
                                        }))}
                                        selected={expertise}
                                        onChange={setExpertise}
                                        placeholder="Select expertise"
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Generate Invite Link
                            </Button>
                        </DialogFooter>
                    </form>
                ) : (
                    <div className="space-y-4 py-4">
                        <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                            <p className="text-sm font-medium">Invite link for {email}</p>
                            <div className="flex items-center gap-2">
                                <Input
                                    readOnly
                                    value={inviteUrl}
                                    className="text-xs font-mono bg-background"
                                />
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="shrink-0"
                                    onClick={handleCopy}
                                >
                                    {copied ? (
                                        <Check className="h-4 w-4 text-green-500" />
                                    ) : (
                                        <Copy className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                This link is one-time use and expires in 7 days. Share it via WhatsApp, Slack, or any messaging app.
                            </p>
                        </div>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => handleClose(false)}
                            >
                                Done
                            </Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
