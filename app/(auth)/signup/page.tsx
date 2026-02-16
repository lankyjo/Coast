"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signUp } from "@/lib/auth-client";

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

    if (!invitationToken) {
        return (
            <div className="text-center">
                <h1 className="text-2xl font-semibold text-foreground">
                    Access Denied
                </h1>
                <p className="mt-2 text-sm text-muted">
                    You need an invitation to create an account.
                </p>
                <p className="mt-4 text-xs text-muted-foreground">
                    Contact your admin to get an invitation link.
                </p>
            </div>
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
        <div className="w-full max-w-[400px]">
            <div className="mb-8 text-center">
                <h1 className="text-2xl font-semibold text-foreground">
                    Join The Coast
                </h1>
                <p className="mt-1 text-sm text-muted">
                    You&apos;ve been invited to join the team
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                        {error}
                    </div>
                )}

                <div className="space-y-1.5">
                    <label htmlFor="name" className="block text-sm font-medium text-foreground">
                        Full Name
                    </label>
                    <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your full name"
                        required
                        className="w-full rounded-xl border border-card-border bg-white px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
                    />
                </div>

                <div className="space-y-1.5">
                    <label htmlFor="email" className="block text-sm font-medium text-foreground">
                        Email
                    </label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@davidcoast.com"
                        required
                        readOnly={!!prefillEmail}
                        className="w-full rounded-xl border border-card-border bg-white px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10 read-only:bg-background read-only:cursor-not-allowed"
                    />
                </div>

                <div className="space-y-1.5">
                    <label htmlFor="password" className="block text-sm font-medium text-foreground">
                        Password
                    </label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min. 8 characters"
                        required
                        className="w-full rounded-xl border border-card-border bg-white px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
                    />
                </div>

                <div className="space-y-1.5">
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
                        Confirm Password
                    </label>
                    <input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm your password"
                        required
                        className="w-full rounded-xl border border-card-border bg-white px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
                    />
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full rounded-xl bg-foreground px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                            <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Creating account...
                        </span>
                    ) : (
                        "Create Account"
                    )}
                </button>
            </form>
        </div>
    );
}

export default function SignupPage() {
    return (
        <main className="flex min-h-screen items-center justify-center bg-background px-4">
            <Suspense
                fallback={
                    <div className="flex items-center gap-2 text-muted">Loading...</div>
                }
            >
                <SignupForm />
            </Suspense>
        </main>
    );
}
