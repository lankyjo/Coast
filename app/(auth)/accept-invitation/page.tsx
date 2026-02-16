"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { getInvitationByToken, acceptInvitation } from "@/actions/invite.actions";
import { toast } from "sonner"; // Assuming you have sonner or similar, if not I'll use simple alert or local state

function AcceptInvitationContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [status, setStatus] = useState<"verifying" | "valid" | "success" | "error">("verifying");
    const [invitationData, setInvitationData] = useState<{ email: string; role: string } | null>(null);
    const [errorMsg, setErrorMsg] = useState("");

    // Form state
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!token) {
            setStatus("error");
            setErrorMsg("Invalid invitation link.");
            return;
        }

        async function verify() {
            const result = await getInvitationByToken(token!);
            if (result.error || !result.data) {
                setStatus("error");
                setErrorMsg(result.error || "Failed to load invitation.");
            } else {
                setInvitationData(result.data);
                setStatus("valid");
            }
        }

        verify();
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;

        setIsSubmitting(true);
        try {
            const result = await acceptInvitation(token, { name, password });
            if (result.error) {
                setErrorMsg(result.error);
                // Don't change status to error entire page, just show alert?
                // Or maybe just show error in form
                toast.error(result.error);
            } else {
                setStatus("success");
                setTimeout(() => {
                    router.push("/dashboard");
                    router.refresh();
                }, 2000);
            }
        } catch (err) {
            setErrorMsg("Something went wrong.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (status === "verifying") {
        return (
            <Card className="w-full max-w-md">
                <CardContent className="flex flex-col items-center justify-center pt-10 pb-10">
                    <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                    <p className="text-muted-foreground">Verifying invitation...</p>
                </CardContent>
            </Card>
        );
    }

    if (status === "error") {
        return (
            <Card className="w-full max-w-md border-destructive/50">
                <CardHeader>
                    <CardTitle className="text-destructive flex items-center gap-2">
                        <AlertCircle className="h-5 w-5" /> Invitation Error
                    </CardTitle>
                    <CardDescription>{errorMsg}</CardDescription>
                </CardHeader>
                <CardFooter>
                    <Button variant="outline" className="w-full" onClick={() => router.push("/login")}>
                        Back to Login
                    </Button>
                </CardFooter>
            </Card>
        );
    }

    if (status === "success") {
        return (
            <Card className="w-full max-w-md border-green-500/50">
                <CardContent className="flex flex-col items-center justify-center pt-10 pb-10 text-center">
                    <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
                    <CardTitle className="text-2xl mb-2">Welcome to Coast!</CardTitle>
                    <p className="text-muted-foreground">Your account has been created. Redirecting...</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle>Accept Invitation</CardTitle>
                <CardDescription>
                    You have been invited to join <strong>The Coast</strong> as a <strong>{invitationData?.role}</strong>.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Email</Label>
                        <Input value={invitationData?.email} disabled className="bg-muted" />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                            id="name"
                            placeholder="John Doe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            minLength={2}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Create Password</Label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={8}
                        />
                    </div>

                    {errorMsg && (
                        <div className="text-sm text-destructive flex items-center gap-2 bg-destructive/10 p-3 rounded-md">
                            <AlertCircle className="h-4 w-4" /> {errorMsg}
                        </div>
                    )}

                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Account
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}

export default function AcceptInvitationPage() {
    return (
        <main className="flex min-h-screen items-center justify-center bg-background px-4">
            <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin" />}>
                <AcceptInvitationContent />
            </Suspense>
        </main>
    );
}
