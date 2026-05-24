// Version: 1.0
import { NextRequest, NextResponse } from "next/server";

// Lightweight middleware: just guard the `(app)` group routes. We do per-page session
// reads in server components for actual auth; this middleware is a redirect helper.
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/"],
};
