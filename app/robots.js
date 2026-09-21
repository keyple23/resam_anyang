import { site } from "@/lib/site";

// 네이버 Yeti 와 주요 AI 크롤러를 명시적으로 허용한다.
// 하나라도 막혀 있으면 그 엔진의 검색 결과와 답변에 우리 글이 절대 안 나온다.
const ALLOW_ALL = [
  "Yeti",              // 네이버
  "Googlebot",
  "Daumoa",            // 다음
  "bingbot",
  "GPTBot",            // 챗GPT 학습
  "OAI-SearchBot",     // 챗GPT 검색 노출
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Google-Extended",   // 제미나이
  "Applebot-Extended",
  "CCBot",
  "meta-externalagent",
];

export default function robots() {
  return {
    rules: [
      // 관리자 화면은 어디에도 노출되면 안 된다
      { userAgent: "*", allow: "/", disallow: ["/admin", "/admin/"] },
      ...ALLOW_ALL.map((ua) => ({ userAgent: ua, allow: "/", disallow: ["/admin", "/admin/"] })),
    ],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
