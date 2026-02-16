"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signUp } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

function SignupForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const invitationToken = searchParams.get("token");
    const prefillEmail = searchParams.get("email") || "";

    const [name, setName] = useState("");
    const [email, setEmail] = useState(prefillEmail);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Block access without invitation token
    if (!invitationToken) {
        return (
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <CardTitle className="text-destructive">Access Denied</CardTitle>
                    <CardDescription>
                        You need an invitation to create an account.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Contact your admin to get an invitation link.
                    </p>
                </CardContent>
            </Card>
        );
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters");
            return;
        }

        setIsLoading(true);

        try {
            const result = await signUp.email({
                name,
                email,
                password,
            });

            if (result.error) {
                setError(result.error.message || "Failed to create account");
                setIsLoading(false);
                return;
            }

            router.push(`/accept-invitation?id=${invitationToken}`);
        } catch {
            setError("Something went wrong. Please try again.");
            setIsLoading(false);
        }
    }

    return (
        <Card className="w-full max-w-[400px]">
            <CardHeader>
                <CardTitle>Join The Coast</CardTitle>
                <CardDescription>
                    You&apos;ve been invited to join the team
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="rounded-md bg-destructive/15 px-4 py-3 text-sm text-destructive">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                            id="name"
                            type="text"
                            placeholder="Your full name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="you@davidcoast.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            readOnly={!!prefillEmail}
                            className={prefillEmail ? "bg-muted text-muted-foreground opacity-70" : ""}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="Min. 8 characters"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            placeholder="Confirm your password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating account...
                            </>
                        ) : (
                            "Create Account"
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}

export default function SignupPage() {
    return (
        <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
            <Suspense fallback={<div className="flex h-[400px] w-full items-center justify-center text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>}>
                <SignupForm />
            </Suspense>
        </main>
    );
}
