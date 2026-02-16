import { NextRequest, NextResponse } from "next/server";

export default async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Public routes that don't need auth
    const publicRoutes = ["/", "/login", "/signup", "/accept-invitation"];
    const isPublicRoute =
        publicRoutes.includes(pathname) || pathname.startsWith("/share/");
    const isAPIRoute = pathname.startsWith("/api/");

    // Don't process API routes (Better Auth handles its own auth)
    if (isAPIRoute) {
        return NextResponse.next();
    }

    // Check for session cookie (Better Auth uses this cookie name)
    const sessionCookie =
        request.cookies.get("better-auth.session_token") ||
        request.cookies.get("__Secure-better-auth.session_token");

    const isAuthenticated = !!sessionCookie;

    // Redirect unauthenticated users away from protected routes
    if (!isAuthenticated && !isPublicRoute) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Redirect authenticated users away from auth pages
    if (isAuthenticated && (pathname === "/login" || pathname === "/")) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization)
         * - favicon.ico (favicon)
         * - public files (images, etc.)
         */
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
