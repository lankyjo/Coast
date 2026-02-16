"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

function AcceptInvitationContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const invitationId = searchParams.get("id");

    const [status, setStatus] = useState<"loading" | "success" | "error">(
        "loading"
    );
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        if (!invitationId) {
            setStatus("error");
            setErrorMessage("No invitation ID provided.");
            return;
        }

        async function acceptInvitation() {
            try {
                const { error } = await authClient.organization.acceptInvitation({
                    invitationId: invitationId!,
                });

                if (error) {
                    setStatus("error");
                    setErrorMessage(error.message || "Failed to accept invitation.");
                    return;
                }

                setStatus("success");
                setTimeout(() => router.push("/dashboard"), 2000);
            } catch {
                setStatus("error");
                setErrorMessage("Something went wrong. Please try again.");
            }
        }

        acceptInvitation();
    }, [invitationId, router]);

    return (
        <Card className="w-full max-w-[400px] text-center">
            <CardHeader>
                <CardTitle>
                    {status === "loading" && "Accepting Invitation"}
                    {status === "success" && "Welcome to The Coast"}
                    {status === "error" && "Invitation Error"}
                </CardTitle>
                <CardDescription>
                    {status === "loading" && "Setting up your account..."}
                    {status === "success" && "Redirecting you to the dashboard..."}
                    {status === "error" && "There was a problem accepting your invitation."}
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
                {status === "loading" && (
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                )}

                {status === "success" && (
                    <CheckCircle2 className="h-12 w-12 text-green-500" />
                )}

                {status === "error" && (
                    <div className="flex flex-col items-center gap-4">
                        <XCircle className="h-12 w-12 text-destructive" />
                        <p className="text-sm text-destructive">{errorMessage}</p>
                        <Button onClick={() => router.push("/login")} variant="default">
                            Go to Login
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export default function AcceptInvitationPage() {
    return (
        <main className="flex min-h-screen items-center justify-center bg-background px-4">
            <Suspense
                fallback={
                    <div className="flex h-[400px] w-full items-center justify-center text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>
                }
            >
                <AcceptInvitationContent />
            </Suspense>
        </main>
    );
}
