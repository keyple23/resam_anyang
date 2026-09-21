import { site, absoluteUrl } from "@/lib/site";
import { getArticles } from "@/lib/articles";

export const dynamic = "force-static";

function esc(s = "") {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function GET() {
  const items = getArticles()
    .map((a) => {
      const url = absoluteUrl(`/articles/${a.slug}/`);
      const date = new Date(a.published || Date.now()).toUTCString();
      return `    <item>
      <title>${esc(a.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${esc(a.description)}</description>
      <pubDate>${date}</pubDate>
      <author>${esc(a.author?.name || site.defaultAuthor.name)}</author>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(site.name)}</title>
    <link>${site.url}</link>
    <description>${esc(site.description)}</description>
    <language>ko</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${site.url}/rss.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
