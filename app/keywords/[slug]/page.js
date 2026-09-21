import { notFound } from "next/navigation";
import { site, absoluteUrl } from "@/lib/site";
import { getKeyword, getKeywords } from "@/lib/keywords";
import { getArticle, renderMarkdown, extractHeadings, slugifyHeading } from "@/lib/articles";
import { JsonLd, breadcrumbSchema, faqSchema } from "@/lib/schema";
import { absoluteImage } from "@/lib/images";
import Cover from "@/components/Cover";

export function generateStaticParams() {
  return getKeywords().map((k) => ({ slug: k.slug }));
}

export function generateMetadata({ params }) {
  const k = getKeyword(decodeURIComponent(params.slug));
  if (!k) return {};
  const url = `/keywords/${k.slug}/`;
  return {
    title: k.title || `${k.keyword} 정리`,
    description: k.description,
    keywords: [k.keyword, ...k.variants],
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: k.title || k.keyword,
      description: k.description,
      url: absoluteUrl(url),
      images: (k.images?.length ? k.images : [site.ogImage].filter(Boolean))
        .map((i) => absoluteImage(i))
        .filter(Boolean),
    },
  };
}

export default async function KeywordPage({ params }) {
  const k = getKeyword(decodeURIComponent(params.slug));
  if (!k) notFound();

  const bodyHtml = await renderMarkdown(withHeadingIds(k.body));
  const headings = extractHeadings(k.body);
  const linked = (k.articles || []).map((s) => getArticle(s)).filter(Boolean);

  return (
    <article className="article">
      <div className="wrap">
        <header className="article-head">
          <div className="crumb">
            <a href="/">홈</a> · 키워드
          </div>
          <h1>{k.title || k.keyword}</h1>
          <p className="lead">{k.description}</p>
          {k.variants?.length ? (
            <div className="byline">
              <span>{[k.keyword, ...k.variants].join(" · ")}</span>
            </div>
          ) : null}
        </header>

        <Cover src={k.cover} alt={k.coverAlt} caption={k.coverCaption} title={k.title || k.keyword} />

        {headings.length > 2 ? (
          <nav className="toc" aria-label="목차">
            <strong>이 문서에서 다루는 것</strong>
            <ol>
              {headings.map((h) => (
                <li key={h.id}>
                  <a href={`#${h.id}`}>{h.text}</a>
                </li>
              ))}
            </ol>
          </nav>
        ) : null}

        <div className="prose" dangerouslySetInnerHTML={{ __html: bodyHtml }} />

        {k.faq?.length ? (
          <section className="faq">
            <h2>자주 묻는 질문</h2>
            {k.faq.map((q, i) => (
              <details key={i} open={i === 0}>
                <summary>{q.q}</summary>
                <p>{q.a}</p>
              </details>
            ))}
          </section>
        ) : null}

        {linked.length ? (
          <section className="related">
            <h2>{k.keyword} 관련 글</h2>
            <ul>
              {linked.map((a) => (
                <li key={a.slug}>
                  <a href={`/articles/${a.slug}/`}>{a.title}</a>
                  <span>{a.description}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>

      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "홈", path: "/" },
            { name: k.keyword, path: `/keywords/${k.slug}/` },
          ]),
          faqSchema(k.faq),
          linked.length
            ? {
                "@context": "https://schema.org",
                "@type": "ItemList",
                name: `${k.keyword} 관련 글`,
                itemListElement: linked.map((a, i) => ({
                  "@type": "ListItem",
                  position: i + 1,
                  url: absoluteUrl(`/articles/${a.slug}/`),
                  name: a.title,
                })),
              }
            : null,
        ]}
      />
    </article>
  );
}

function withHeadingIds(md) {
  return md
    .split("\n")
    .map((line) => {
      if (!line.startsWith("## ")) return line;
      const text = line.replace(/^##\s+/, "").trim();
      return `<h2 id="${slugifyHeading(text)}">${text}</h2>`;
    })
    .join("\n");
}
