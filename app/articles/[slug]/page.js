import { notFound } from "next/navigation";
import { site, categoryBySlug, absoluteUrl } from "@/lib/site";
import {
  getArticle,
  getArticles,
  getRelated,
  renderMarkdown,
  extractHeadings,
  slugifyHeading,
  readingMinutes,
} from "@/lib/articles";
import {
  JsonLd,
  articleSchema,
  breadcrumbSchema,
  faqSchema,
} from "@/lib/schema";
import { absoluteImage } from "@/lib/images";
import Cover from "@/components/Cover";

export function generateStaticParams() {
  return getArticles().map((a) => ({ slug: a.slug }));
}

export function generateMetadata({ params }) {
  const article = getArticle(params.slug);
  if (!article) return {};
  const url = `/articles/${article.slug}/`;
  return {
    title: article.title,
    description: article.description,
    alternates: { canonical: url },
    keywords: article.keywords,
    openGraph: {
      type: "article",
      title: article.title,
      description: article.description,
      url: absoluteUrl(url),
      publishedTime: article.published,
      modifiedTime: article.updated,
      authors: [article.author?.name || site.defaultAuthor.name],
      images: (article.images?.length
        ? article.images
        : [site.ogImage].filter(Boolean)
      )
        .map((i) => absoluteImage(i))
        .filter(Boolean),
    },
  };
}

export default async function ArticlePage({ params }) {
  const article = getArticle(params.slug);
  if (!article) notFound();

  const cat = categoryBySlug(article.category);
  const bodyHtml = await renderMarkdown(withHeadingIds(article.body));
  const headings = extractHeadings(article.body);
  const related = getRelated(article);
  const author = article.author?.name || site.defaultAuthor.name;

  return (
    <article className="article">
      <div className="wrap">
        <header className="article-head">
          <div className="crumb">
            <a href="/">홈</a>
            {cat ? (
              <>
                {" · "}
                <a href={`/category/${cat.slug}/`}>{cat.name}</a>
              </>
            ) : null}
          </div>
          <h1>{article.title}</h1>
          <p className="lead">{article.description}</p>
          <div className="byline">
            <span>{author}</span>
            <span>발행 {article.published}</span>
            {article.updated && article.updated !== article.published ? (
              <span>수정 {article.updated}</span>
            ) : null}
            <span>읽는 시간 약 {readingMinutes(article.body)}분</span>
          </div>
        </header>

        <Cover
          src={article.cover}
          alt={article.coverAlt}
          caption={article.coverCaption}
          title={article.title}
        />

        {headings.length > 2 ? (
          <nav className="toc" aria-label="목차">
            <strong>이 글에서 다루는 것</strong>
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

        {article.faq?.length ? (
          <section className="faq">
            <h2>자주 묻는 질문</h2>
            {article.faq.map((q, i) => (
              <details key={i} open={i === 0}>
                <summary>{q.q}</summary>
                <p>{q.a}</p>
              </details>
            ))}
          </section>
        ) : null}

        {related.length ? (
          <section className="related">
            <h2>함께 보면 좋은 글</h2>
            <ul>
              {related.map((r) => (
                <li key={r.slug}>
                  <a href={`/articles/${r.slug}/`}>{r.title}</a>
                  <span>{r.description}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>

      <JsonLd
        data={[
          articleSchema(article),
          breadcrumbSchema([
            { name: "홈", path: "/" },
            ...(cat ? [{ name: cat.name, path: `/category/${cat.slug}/` }] : []),
            { name: article.title, path: `/articles/${article.slug}/` },
          ]),
          faqSchema(article.faq),
        ]}
      />
    </article>
  );
}

/** 목차 링크가 걸리도록 h2 에 id 를 붙인다 */
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
