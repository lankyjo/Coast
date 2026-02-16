"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "@/lib/auth-client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { MoveLeft, Loader2 } from "lucide-react";

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const result = await signIn.email({
                email,
                password,
            });

            if (result.error) {
                setError(result.error.message || "Invalid credentials");
                setIsLoading(false);
                return;
            }

            router.push(callbackUrl);
        } catch {
            setError("Something went wrong. Please try again.");
            setIsLoading(false);
        }
    }

    return (
        <div className="w-full max-w-[400px]">
            <div className="mb-4">
                <Button variant="ghost" size="sm" asChild className="-ml-3 mb-4 text-muted-foreground">
                    <Link href="/">
                        <MoveLeft className="mr-2 h-4 w-4" /> Back to Home
                    </Link>
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Welcome back</CardTitle>
                    <CardDescription>Sign in to your Coast account</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="rounded-md bg-destructive/15 px-4 py-3 text-sm text-destructive">
                                {error}
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@davidcoast.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                "Sign In"
                            )}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <p className="text-xs text-muted-foreground">
                        Only authorized team members can access this platform.
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}

export default function LoginPage() {
    return (
        <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
            <Suspense fallback={<div className="flex h-[400px] w-full items-center justify-center text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>}>
                <LoginForm />
            </Suspense>
        </main>
    );
}
