import { Suspense } from "react";
import { getTeamData } from "@/actions/admin.actions";
import { MembersList } from "@/components/admin/MembersList";
import { InviteMemberDialog } from "@/components/admin/InviteMemberDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { redirect } from "next/navigation";
import { isAdmin } from "@/actions/auth.actions";
import { Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
    // Double check admin access (middleware should handle, but safe is safe)
    if (!(await isAdmin())) {
        redirect("/dashboard");
    }

    const { data, error } = await getTeamData();

    if (error || !data) {
        return (
            <div className="p-8 text-center text-destructive">
                Failed to load admin dashboard. Please try again.
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                    <p className="text-muted-foreground">
                        Manage your team and workspace settings.
                    </p>
                </div>
                <InviteMemberDialog />
            </div>

            <Tabs defaultValue="team" className="w-full">
                <TabsList>
                    <TabsTrigger value="team">Team Members</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="team" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Team Management</CardTitle>
                            <CardDescription>
                                Manage members, roles, and pending invitations.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin" />}>
                                <MembersList
                                    initialMembers={data.members}
                                    initialInvitations={data.invitations}
                                />
                            </Suspense>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="settings" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Workspace Settings</CardTitle>
                            <CardDescription>
                                Configure global settings for your workspace.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground text-sm">
                                Global settings like workspace name and billing will appear here.
                            </p>
                            {/* Future: Edit workspace name, delete workspace, etc. */}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
