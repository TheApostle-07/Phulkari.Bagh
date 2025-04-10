// middleware.ts
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import jwt from "jsonwebtoken"

const SECRET_KEY = process.env.JWT_SECRET || "CHANGE_THIS_TO_A_LONG_RANDOM_STRING"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow all requests to /admin/login (including sub-paths)
  if (pathname.startsWith("/admin/login")) {
    return NextResponse.next()
  }

  // Protect any route under /admin
  if (pathname.startsWith("/admin")) {
    const token = request.cookies.get("admin_jwt")?.value
    if (!token) {
      return NextResponse.redirect(new URL("/admin/login", request.url))
    }
    try {
      jwt.verify(token, SECRET_KEY)
      return NextResponse.next()
    } catch (_err) {
      return NextResponse.redirect(new URL("/admin/login", request.url))
    }
  }

  return NextResponse.next()
}
