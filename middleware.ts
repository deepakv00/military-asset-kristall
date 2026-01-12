import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifyJWT } from "@/lib/auth"

// Paths that don't require authentication
const publicPaths = ["/api/auth/login", "/login"]

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Allow public paths
    if (publicPaths.some((path) => pathname.startsWith(path))) {
        return NextResponse.next()
    }

    // Check for token
    const token = request.headers.get("Authorization")?.split(" ")[1] || request.cookies.get("token")?.value

    if (!token) {
        // API routes return 401
        if (pathname.startsWith("/api")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }
        // Pages redirect to login
        return NextResponse.redirect(new URL("/login", request.url))
    }

    // Verify token
    const payload = await verifyJWT(token)

    if (!payload) {
        if (pathname.startsWith("/api")) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 })
        }
        return NextResponse.redirect(new URL("/login", request.url))
    }

    // Add user info to headers for API routes
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set("x-user-id", payload.id as string)
    requestHeaders.set("x-user-role", payload.role as string)
    requestHeaders.set("x-user-base-id", (payload.baseId as string) || "")

    return NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    })
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        "/((?!_next/static|_next/image|favicon.ico|public).*)",
    ],
}
