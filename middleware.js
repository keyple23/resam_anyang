import { NextResponse } from "next/server";

// ─────────────────────────────────────────────────────────────
// 관리자 화면(/admin)에 비밀번호를 건다.
//
// Vercel 환경변수에 ADMIN_USER 와 ADMIN_PASSWORD 를 넣으면 켜지고,
// 넣지 않으면 그냥 통과한다.
//
// 브라우저가 기본 제공하는 로그인 창이 뜨는 방식이라
// 화면을 따로 만들 필요가 없고, 서버에서 막기 때문에
// 소스를 봐도 우회할 수 없다.
// ─────────────────────────────────────────────────────────────

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};

export function middleware(request) {
  const user = process.env.ADMIN_USER;
  const pass = process.env.ADMIN_PASSWORD;

  // 설정이 없으면 잠그지 않는다
  if (!user || !pass) return NextResponse.next();

  const header = request.headers.get("authorization") || "";

  if (header.startsWith("Basic ")) {
    try {
      const decoded = atob(header.slice(6));
      const idx = decoded.indexOf(":");
      const inputUser = decoded.slice(0, idx);
      const inputPass = decoded.slice(idx + 1);
      if (inputUser === user && inputPass === pass) {
        return NextResponse.next();
      }
    } catch {
      // 형식이 깨진 경우는 아래에서 다시 물어본다
    }
  }

  return new NextResponse("인증이 필요합니다.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Admin", charset="UTF-8"',
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
