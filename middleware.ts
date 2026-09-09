import { NextRequest, NextResponse } from "next/server"

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Protect /manage routes with HTTP Basic Auth
  if (pathname.startsWith("/manage")) {
    const secret = process.env.MANAGE_SECRET
    if (!secret) return NextResponse.next() // no secret = unprotected (dev mode)

    const auth = req.headers.get("authorization")
    if (auth) {
      const [scheme, encoded] = auth.split(" ")
      if (scheme === "Basic" && encoded) {
        const decoded = Buffer.from(encoded, "base64").toString("utf-8")
        const [, password] = decoded.split(":")
        if (password === secret) return NextResponse.next()
      }
    }

    return new NextResponse("Authentication required", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Newsletter Management"' },
    })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/manage/:path*"],
}
