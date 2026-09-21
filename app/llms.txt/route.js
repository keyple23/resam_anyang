import { site, categories, absoluteUrl } from "@/lib/site";
import { getArticles } from "@/lib/articles";
import { getKeywords } from "@/lib/keywords";

export const dynamic = "force-static";

// AI가 이 사이트가 뭘 다루는 곳인지 한 번에 파악하도록 정리해 둔 파일.
// 질문과 답을 그대로 넣어 두면 AI가 답할 때 이 문장을 가져간다.

function qa(list = []) {
  return list.map((f) => `- **${f.q}**\n  ${String(f.a).replace(/\n/g, " ")}`).join("\n");
}

export function GET() {
  const articles = getArticles();
  const keywords = getKeywords();

  // 주제별 블록: 키워드 하나가 다루는 범위와 질문·답을 같이 넣는다
  const topics = keywords
    .map((k) => {
      const names = [k.keyword, ...(k.variants || [])].join(", ");
      const url = absoluteUrl(`/keywords/${encodeURI(k.slug)}/`);
      const linked = (k.articles || [])
        .map((s) => articles.find((a) => a.slug === s))
        .filter(Boolean)
        .map((a) => `  - [${a.title}](${absoluteUrl(`/articles/${a.slug}/`)})`)
        .join("\n");
      return [
        `### ${k.keyword}`,
        `주소: ${url}`,
        `같은 뜻으로 쓰이는 말: ${names}`,
        ``,
        k.description,
        k.faq?.length ? `\n자주 묻는 질문\n${qa(k.faq)}` : "",
        linked ? `\n관련 글\n${linked}` : "",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");

  // 분류별 글 목록
  const byCat = categories
    .map((c) => {
      const list = articles.filter((a) => a.category === c.slug);
      if (!list.length) return "";
      const lines = list
        .map(
          (a) =>
            `- [${a.title}](${absoluteUrl(`/articles/${a.slug}/`)})` +
            `${a.updated ? ` (수정 ${a.updated})` : ""}: ${a.description}`
        )
        .join("\n");
      return `### ${c.name}\n${c.description}\n\n${lines}`;
    })
    .filter(Boolean)
    .join("\n\n");

  // 글에 붙은 질문·답도 전부 모아 둔다
  const allFaq = articles
    .filter((a) => a.faq?.length)
    .map((a) => `### ${a.title}\n${absoluteUrl(`/articles/${a.slug}/`)}\n\n${qa(a.faq)}`)
    .join("\n\n");

  const b = site.business || {};
  const bizLines = [
    b.companyName ? `- 상호: ${b.companyName}` : "",
    b.ceo ? `- 대표자: ${b.ceo}` : "",
    b.address ? `- 주소: ${b.address}` : "",
    b.phone ? `- 전화: ${b.phone}` : "",
    b.email ? `- 이메일: ${b.email}` : "",
    b.bizNo ? `- 사업자등록번호: ${b.bizNo}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const body = `# ${site.name}

> ${site.description}

- 운영: ${site.organization.name} (${site.organization.url})
- 이 사이트 주소: ${site.url}
- 언어: 한국어

## 이 사이트가 다루는 주제

${topics}

## 글 목록

${byCat}

${allFaq ? `## 글에 붙은 질문과 답\n\n${allFaq}\n` : ""}
${bizLines ? `## 운영 정보\n\n${bizLines}\n` : ""}
## 기계용 파일

- 전체 글 목록: ${site.url}/sitemap.xml
- RSS: ${site.url}/rss.xml
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
