"use client";

import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Trash2, UserCog, MailX } from "lucide-react";
import { updateMemberRole, removeMember } from "@/actions/admin.actions";
import { revokeInvitation } from "@/actions/invite.actions";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";

interface User {
    _id: string;
    name: string;
    email: string;
    role: "admin" | "member";
    image?: string;
    createdAt: string;
}

interface Invitation {
    _id: string;
    email: string;
    role: "admin" | "member";
    status: "pending" | "accepted";
    createdAt: string;
    expiresAt: string;
}

interface MembersListProps {
    initialMembers: User[];
    initialInvitations: Invitation[];
}

export function MembersList({ initialMembers, initialInvitations }: MembersListProps) {
    // We rely on server actions to revalidate path, so local state updates might be overridden by router refresh.
    // However, optimistic updates are nice. For simplicity, we just trigger action and toast.

    const handleRoleChange = async (userId: string, newRole: "admin" | "member") => {
        const result = await updateMemberRole(userId, newRole);
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Role updated");
        }
    };

    const handleRemoveMember = async (userId: string) => {
        if (!confirm("Are you sure you want to remove this member?")) return;
        const result = await removeMember(userId);
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Member removed");
        }
    };

    const handleRevokeInvite = async (inviteId: string) => {
        if (!confirm("Revoke this invitation?")) return;
        const result = await revokeInvitation(inviteId);
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Invitation revoked");
        }
    };

    return (
        <div className="space-y-6">
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Member</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {initialMembers.map((member) => (
                            <TableRow key={member._id}>
                                <TableCell className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={member.image} alt={member.name} />
                                        <AvatarFallback>{member.name?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <span className="font-medium">{member.name}</span>
                                        <span className="text-xs text-muted-foreground">{member.email}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={member.role === "admin" ? "default" : "secondary"}>
                                        {member.role}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm">
                                    {member.createdAt ? format(new Date(member.createdAt), "MMM d, yyyy") : "-"}
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => handleRoleChange(member._id, member.role === "admin" ? "member" : "admin")}>
                                                <UserCog className="mr-2 h-4 w-4" />
                                                {member.role === "admin" ? "Demote to Member" : "Promote to Admin"}
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem className="text-red-600" onClick={() => handleRemoveMember(member._id)}>
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Remove Member
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {initialInvitations.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold tracking-tight">Pending Invitations</h3>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Sent</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {initialInvitations.map((invite) => (
                                    <TableRow key={invite._id}>
                                        <TableCell className="font-medium">{invite.email}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{invite.role}</Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {format(new Date(invite.createdAt), "MMM d, yyyy")}
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => handleRevokeInvite(invite._id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}
        </div>
    );
}
