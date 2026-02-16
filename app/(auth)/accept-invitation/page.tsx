"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";

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
        <div className="w-full max-w-[400px] text-center">
            {status === "loading" && (
                <div className="flex flex-col items-center gap-4">
                    <svg
                        className="h-8 w-8 animate-spin text-accent"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <h1 className="text-xl font-semibold text-foreground">
                        Accepting invitation...
                    </h1>
                    <p className="text-sm text-muted">Setting up your account</p>
                </div>
            )}

            {status === "success" && (
                <div className="flex flex-col items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                            <path d="M20 6 9 17l-5-5" />
                        </svg>
                    </div>
                    <h1 className="text-xl font-semibold text-foreground">
                        Welcome to The Coast!
                    </h1>
                    <p className="text-sm text-muted">Redirecting you to the dashboard...</p>
                </div>
            )}

            {status === "error" && (
                <div className="flex flex-col items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="15" x2="9" y1="9" y2="15" />
                            <line x1="9" x2="15" y1="9" y2="15" />
                        </svg>
                    </div>
                    <h1 className="text-xl font-semibold text-foreground">
                        Invitation Error
                    </h1>
                    <p className="text-sm text-red-600">{errorMessage}</p>
                    <button
                        onClick={() => router.push("/login")}
                        className="mt-2 rounded-xl bg-foreground px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-foreground/90"
                    >
                        Go to Login
                    </button>
                </div>
            )}
        </div>
    );
}

export default function AcceptInvitationPage() {
    return (
        <main className="flex min-h-screen items-center justify-center bg-background px-4">
            <Suspense
                fallback={
                    <div className="flex items-center gap-2 text-muted">Loading...</div>
                }
            >
                <AcceptInvitationContent />
            </Suspense>
        </main>
    );
}
