import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
    try {
        const result = await Promise.race([
            updateSession(request),
            new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error("supabase_timeout")), 8000)
            ),
        ]);
        return result;
    } catch (err) {
        // Se Supabase não responder, deixa a requisição passar.
        // Os Server Components farão a verificação de auth individualmente.
        console.error("[middleware] error:", err instanceof Error ? err.message : err);
        return NextResponse.next({ request });
    }
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files
         */
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
