import { NextRequest, NextResponse } from "next/server"

export function middleware(request: NextRequest) {
  // /admin パスでのみBasic認証を要求
  if (request.nextUrl.pathname.startsWith("/admin")) {
    const basicAuth = request.headers.get("authorization")

    if (!basicAuth) {
      return new NextResponse("認証が必要です", {
        status: 401,
        headers: {
          "WWW-Authenticate": 'Basic realm="Admin Area"',
        },
      })
    }

    // Basic認証の検証ロジック
    try {
      const authValue = basicAuth.split(" ")[1]
      const [user, password] = atob(authValue).split(":")

      const adminUser = process.env.ADMIN_USER
      const adminPassword = process.env.ADMIN_PASSWORD

      if (!adminUser || !adminPassword) {
        console.error("ADMIN_USER or ADMIN_PASSWORD environment variables are not set")
        return new NextResponse("サーバー設定エラー", { status: 500 })
      }

      if (user !== adminUser || password !== adminPassword) {
        return new NextResponse("認証失敗", {
          status: 401,
          headers: {
            "WWW-Authenticate": 'Basic realm="Admin Area"',
          },
        })
      }
    } catch (error) {
      console.error("Basic auth parsing error:", error)
      return new NextResponse("認証情報が不正です", {
        status: 401,
        headers: {
          "WWW-Authenticate": 'Basic realm="Admin Area"',
        },
      })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: "/admin/:path*",
}