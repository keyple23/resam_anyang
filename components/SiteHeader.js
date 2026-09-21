import { site, categories } from "@/lib/site";
import { getKeywords } from "@/lib/keywords";
import { normalizeImage } from "@/lib/images";

/**
 * 상단 메뉴.
 * 설정에 nav 를 적어두면 그대로 2단으로 보여주고,
 * 비어 있으면 키워드와 분류를 전부 한 줄로 늘어놓는다.
 */
function buildMenu() {
  if (site.nav.length) {
    return site.nav
      .map((item) => ({
        label: item.label || "",
        href: item.href || "",
        children: Array.isArray(item.children)
          ? item.children.filter((c) => c && c.label && c.href)
          : [],
      }))
      .filter((i) => i.label && i.href);
  }

  return [
    ...getKeywords().map((k) => ({
      label: k.keyword,
      href: `/keywords/${k.slug}/`,
      children: [],
    })),
    ...categories.map((c) => ({
      label: c.name,
      href: `/category/${c.slug}/`,
      children: [],
    })),
  ];
}

/** 화면 폭에 따라 다른 파일을 내려보낸다. 모바일용이 없으면 하나로 쓴다 */
function PromoImage({ pc, mo, alt }) {
  if (!mo) return <img src={pc} alt={alt} />;
  return (
    <picture>
      <source media="(max-width: 640px)" srcSet={mo} />
      <img src={pc} alt={alt} />
    </picture>
  );
}

export default function SiteHeader() {
  const logo = normalizeImage(site.logo);
  const menu = buildMenu();
  const promo = site.promo || {};
  const promoImg = normalizeImage(promo.image);
  const promoMo = normalizeImage(promo.imageMobile);

  return (
    <header className="site-header">
      <div className="hdr-top">
        <div className="wrap">
          <div className="hdr-side hdr-left" />

          <a className="hdr-logo" href="/">
            {logo ? (
              <img src={logo} alt={site.name} className="hdr-logo-img" />
            ) : (
              <span className="hdr-logo-box">{site.shortName || site.name}</span>
            )}
            {site.tagline ? <small>{site.tagline}</small> : null}
          </a>

          <div className="hdr-side hdr-right">
            <a className="site-cta" href={site.organization.url}>
              {site.mainLink.label} 바로가기
            </a>
          </div>
        </div>
      </div>

      <nav className="hdr-nav" aria-label="주요 메뉴">
        <div className="wrap">
          {menu.map((item) => (
            <div className="hdr-item" key={item.href}>
              <a className="hdr-top-link" href={item.href}>
                {item.label}
              </a>

              {item.children.length ? (
                <div className="hdr-sub">
                  {item.children.map((c) => (
                    <a key={c.href} href={c.href}>
                      {c.label}
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </nav>

      {/* 행사 띠. 관리자 화면 브랜드 설정에서 넣고 뺀다.
          모바일용 이미지를 따로 넣으면 좁은 화면에서 그쪽으로 바뀐다 */}
      {promoImg && promo.show !== false ? (
        <div className="promo">
          {promo.href ? (
            <a href={promo.href}>
              <PromoImage pc={promoImg} mo={promoMo} alt={promo.alt || ""} />
            </a>
          ) : (
            <PromoImage pc={promoImg} mo={promoMo} alt={promo.alt || ""} />
          )}
        </div>
      ) : null}
    </header>
  );
}
