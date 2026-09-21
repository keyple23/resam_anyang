import { site, categories, categoryBySlug } from "@/lib/site";
import { getArticles, renderMarkdown } from "@/lib/articles";
import { getKeywords } from "@/lib/keywords";
import { getHomePost, injectCta } from "@/lib/home";
import { normalizeImage } from "@/lib/images";
import { JsonLd, localBusinessSchema, collectionPageSchema, siteLinksSchema } from "@/lib/schema";
import Thumb from "@/components/Thumb";

export const metadata = {
  alternates: { canonical: "/" },
};

/** 카드에 보여줄 짧은 제목. 검색용 제목의 앞부분만 쓴다 */
function shortTitle(t = "") {
  return String(t).split("|")[0].trim() || t;
}

/** 목록 한 줄 */
function Row({ article }) {
  const cat = categoryBySlug(article.category);
  return (
    <li className="row">
      <a href={`/articles/${article.slug}/`}>
        {cat ? <span className="badge">{cat.name}</span> : null}
        <h3>{article.title}</h3>
        <p>{article.description}</p>
        <span className="by">
          By {article.author?.name || site.defaultAuthor.name}
          {article.published ? ` · ${article.published}` : ""}
        </span>
      </a>
    </li>
  );
}

/** 아래쪽 '같이 보면 좋은 글' 카드 */
function RelatedCard({ article }) {
  return (
    <a className="rel-card" href={`/articles/${article.slug}/`}>
      <Thumb src={article.cover} alt={article.coverAlt} label={article.title} />
      <span className="rel-body">
        <h3>{article.title}</h3>
        <p>{article.description}</p>
        <span className="by">
          {article.author?.name || site.defaultAuthor.name}
          {article.published ? ` · ${article.published}` : ""}
        </span>
      </span>
    </a>
  );
}

export default async function Home() {
  const all = getArticles();
  const keywords = getKeywords();
  const post = getHomePost();
  const [featured, ...rest] = all;
  const hero = normalizeImage(site.heroImage);

  const schema = (
    <JsonLd
      data={[
        localBusinessSchema(),
        collectionPageSchema(all),
        siteLinksSchema([
          ...keywords.map((k) => ({
            name: shortTitle(k.title) || k.keyword,
            path: `/keywords/${k.slug}/`,
            image: k.cover,
          })),
          ...(featured
            ? [{ name: featured.title, path: `/articles/${featured.slug}/`, image: featured.cover }]
            : []),
        ]),
      ]}
    />
  );

  // ── 홈 글이 있으면 홈을 글 한 편처럼 보여준다 ──────────────
  if (post) {
    const bodyHtml = injectCta(await renderMarkdown(post.body), post);
    const list = all.slice(0, 6);

    return (
      <article className="post">
        <div className="post-wrap">
          <div className="post-crumb">
            <a href="/">{site.name}</a>
            <span>/</span>
            <span>{shortTitle(post.title)}</span>
          </div>

          {post.emoji ? <div className="post-emoji">{post.emoji}</div> : null}
          <h1 className="post-title">{post.title}</h1>

          <dl className="post-meta">
            {post.published ? (
              <div>
                <dt>작성일</dt>
                <dd>{post.published}</dd>
              </div>
            ) : null}
            {post.updated && post.updated !== post.published ? (
              <div>
                <dt>수정일</dt>
                <dd>{post.updated}</dd>
              </div>
            ) : null}
            {post.author ? (
              <div>
                <dt>작성</dt>
                <dd>{post.author}</dd>
              </div>
            ) : null}
            {post.tags.length ? (
              <div>
                <dt>태그</dt>
                <dd className="post-tagrow">
                  {post.tags.map((t) => (
                    <span className="post-tag" key={t}>
                      {t}
                    </span>
                  ))}
                </dd>
              </div>
            ) : null}
          </dl>

          {post.notice ? <p className="post-notice">{post.notice}</p> : null}

          <div className="prose" dangerouslySetInnerHTML={{ __html: bodyHtml }} />

          {post.tags.length ? (
            <p className="post-hash">{post.tags.map((t) => `#${t.replace(/\s+/g, "")}`).join(" ")}</p>
          ) : null}
        </div>

        {keywords.length ? (
          <section className="post-sec">
            <div className="post-wrap">
              <h2 className="post-sec-title">주제별로 보기</h2>
              <div className="rel-grid">
                {keywords.map((k) => (
                  <a className="rel-card" key={k.slug} href={`/keywords/${k.slug}/`}>
                    <Thumb src={k.cover} alt={k.coverAlt} label={shortTitle(k.title) || k.keyword} />
                    <span className="rel-body">
                      <h3>{shortTitle(k.title) || k.keyword}</h3>
                      <p>{k.description}</p>
                      <span className="by">{site.defaultAuthor.name}</span>
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {list.length ? (
          <section className="post-sec">
            <div className="post-wrap">
              <h2 className="post-sec-title">같이 보면 좋은 글</h2>
              <div className="rel-grid">
                {list.map((a) => (
                  <RelatedCard key={a.slug} article={a} />
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {schema}
      </article>
    );
  }

  // ── 홈 글이 없으면 예전처럼 목록으로 보여준다 ──────────────
  if (!featured) {
    return (
      <section className="section">
        <div className="wrap">
          <p style={{ color: "var(--muted)" }}>
            아직 등록된 글이 없습니다. 관리자 화면에서 글을 추가하면 여기에 나옵니다.
          </p>
        </div>
      </section>
    );
  }

  const top = rest.slice(0, 4);
  const more = rest.slice(4, 10);

  return (
    <>
      <section className="brandbar">
        {hero ? <img src={hero} alt="" /> : null}
        <div className="wrap">
          <h1>{site.tagline}</h1>
          <p>{site.description}</p>
          <a className="brandbar-btn" href={site.organization.url}>
            {site.organization.name} {site.mainLink.label} 바로가기
          </a>
        </div>
      </section>

      <section className="home-lead">
        <div className="wrap">
          <a className="lead-img" href={`/articles/${featured.slug}/`}>
            <Thumb src={featured.cover} alt={featured.coverAlt} label={featured.title} size="wide" />
          </a>
          <ul className="lead-list">
            <Row article={featured} />
            {top.map((a) => (
              <Row key={a.slug} article={a} />
            ))}
          </ul>
        </div>
      </section>

      {keywords.length ? (
        <section className="strip">
          <div className="wrap">
            <h2 className="strip-title">주제별로 보기</h2>
            <div className="strip-grid">
              {keywords.map((k) => (
                <a className="strip-card" key={k.slug} href={`/keywords/${k.slug}/`}>
                  <Thumb src={k.cover} alt={k.coverAlt} label={shortTitle(k.title) || k.keyword} />
                  <span className="strip-body">
                    <span className="badge">{k.keyword}</span>
                    <h3>{shortTitle(k.title) || k.keyword}</h3>
                    <p>{k.description}</p>
                    <span className="by">By {site.defaultAuthor.name}</span>
                  </span>
                </a>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {more.length ? (
        <section className="strip">
          <div className="wrap">
            <h2 className="strip-title">더 읽어보기</h2>
            <ul className="lead-list lead-list-wide">
              {more.map((a) => (
                <Row key={a.slug} article={a} />
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {categories.map((c) => {
        const listC = all.filter((a) => a.category === c.slug).slice(0, 4);
        if (!listC.length) return null;
        return (
          <section className="strip" key={c.slug}>
            <div className="wrap">
              <h2 className="strip-title">
                <a href={`/category/${c.slug}/`}>{c.name}</a>
              </h2>
              <ul className="lead-list lead-list-wide">
                {listC.map((a) => (
                  <Row key={a.slug} article={a} />
                ))}
              </ul>
            </div>
          </section>
        );
      })}

      {schema}
    </>
  );
}
