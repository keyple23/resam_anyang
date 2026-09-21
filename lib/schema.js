// AI와 검색엔진이 기계적으로 읽는 구조화 데이터(JSON-LD)를 만든다.
// 이게 있으면 AI가 내용을 추측하지 않고 그대로 가져간다.
import { site, absoluteUrl, categoryBySlug } from "./site";
import { absoluteImage, imageObject } from "./images";

/** 설정에 적어둔 대표 키워드를 쉼표로 이어 붙인다 */
function keywordsText() {
  return site.keywords.length ? site.keywords.join(", ") : "";
}

export function organizationSchema() {
  const kw = keywordsText();
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${site.organization.url || site.url}#organization`,
    name: site.organization.name,
    legalName: site.organization.legalName,
    url: site.organization.url,
    logo: absoluteUrl(site.organization.logo),
    description: site.description,
    ...(kw ? { keywords: kw } : {}),
    ...(site.organization.sameAs?.length ? { sameAs: site.organization.sameAs } : {}),
  };
}

export function webSiteSchema() {
  const kw = keywordsText();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${site.url}#website`,
    name: site.name,
    url: site.url,
    inLanguage: site.lang,
    description: site.description,
    ...(kw ? { keywords: kw } : {}),
    publisher: {
      "@type": "Organization",
      "@id": `${site.organization.url || site.url}#organization`,
      name: site.organization.name,
    },
  };
}

/**
 * 오프라인 매장이나 사업장 정보를 그대로 알려주는 구조화 데이터.
 * 주소나 전화번호가 설정에 없으면 아예 만들지 않는다. 빈 값을 넣으면 오류로 잡힌다.
 */
export function localBusinessSchema() {
  const b = site.business || {};
  const org = site.organization || {};
  const street = b.streetAddress || b.address || "";
  if (!street && !b.phone) return null;

  const kw = keywordsText();
  const address = {
    "@type": "PostalAddress",
    ...(street ? { streetAddress: street } : {}),
    ...(b.addressLocality ? { addressLocality: b.addressLocality } : {}),
    ...(b.addressRegion ? { addressRegion: b.addressRegion } : {}),
    ...(b.postalCode ? { postalCode: b.postalCode } : {}),
    addressCountry: b.addressCountry || "KR",
  };

  // 영업시간은 "Mo-Sa 10:00-22:00" 형식만 인정된다. 형식이 아닌 줄은 빼고 넣는다.
  const hoursRe = /^[A-Za-z,\-\s]+\d{2}:\d{2}-\d{2}:\d{2}$/;
  // 요일마다 시간이 다르면 세미콜론(;)으로 이어 적는다. 예: "Mo-Fr 11:00-21:00; Sa 10:00-15:00"
  const hoursList = (Array.isArray(b.openingHours) ? b.openingHours : String(b.openingHours || "").split(";"))
    .map((h) => String(h || "").trim())
    .filter((h) => hoursRe.test(h));
  const hoursOk = hoursList.length > 0;

  return {
    "@context": "https://schema.org",
    "@type": b.type || "LocalBusiness",
    "@id": `${org.url || site.url}#business`,
    name: b.companyName || org.name || site.name,
    description: site.description,
    url: org.url || site.url,
    ...(kw ? { keywords: kw } : {}),
    ...(org.logo ? { image: absoluteUrl(org.logo) } : {}),
    ...(b.phone ? { telephone: b.phone } : {}),
    ...(b.email ? { email: b.email } : {}),
    ...(b.priceRange ? { priceRange: b.priceRange } : {}),
    address,
    ...(hoursOk ? { openingHours: hoursList.length === 1 ? hoursList[0] : hoursList } : {}),
    ...(org.sameAs?.length ? { sameAs: org.sameAs } : {}),
    // 좌표가 있으면 지도 위치로, 진료 지역이 있으면 "어느 동네 사람이 오는 곳인지"로 읽힌다
    ...(Number.isFinite(b.geo?.lat) && Number.isFinite(b.geo?.lng)
      ? {
          geo: { "@type": "GeoCoordinates", latitude: b.geo.lat, longitude: b.geo.lng },
          hasMap: `https://map.naver.com/p/search/${encodeURIComponent(b.companyName || site.name)}`,
        }
      : {}),
    ...(Array.isArray(b.areaServed) && b.areaServed.length
      ? { areaServed: b.areaServed.map((n) => ({ "@type": "City", name: n })) }
      : {}),
    ...(Array.isArray(b.medicalSpecialty) && b.medicalSpecialty.length
      ? { availableService: b.medicalSpecialty.map((n) => ({ "@type": "MedicalProcedure", name: n })) }
      : {}),
  };
}

/**
 * 검색 결과에서 사이트 아래에 주요 페이지를 함께 보여주게 하는 목록.
 * 네이버 웹사이트탭 상위 사이트들이 쓰는 형태를 그대로 따랐다.
 * 페이지마다 이름, 주소, 대표 이미지가 있어야 의미가 있다.
 */
export function siteLinksSchema(links = []) {
  const items = links
    .map((l) => {
      const img = absoluteImage(l.image) || absoluteImage(site.coverDefault);
      if (!l.name || !l.path) return null;
      return {
        "@type": "ListItem",
        position: 0,
        item: {
          "@type": "WebPage",
          name: l.name,
          url: absoluteUrl(l.path),
          ...(img ? { image: img } : {}),
        },
      };
    })
    .filter(Boolean)
    .map((it, i) => ({ ...it, position: i + 1 }));

  if (!items.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${site.name} 주요 페이지`,
    itemListElement: items,
  };
}

/** 홈에 걸리는 글 목록. 어떤 글이 있는지 크롤러가 한 번에 본다 */
export function collectionPageSchema(articles = []) {
  if (!articles.length) return null;
  const kw = keywordsText();
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${site.url}/#webpage`,
    name: site.homeTitle || site.name,
    url: `${site.url}/`,
    inLanguage: site.lang,
    description: site.description,
    ...(kw ? { keywords: kw } : {}),
    isPartOf: { "@id": `${site.url}#website` },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: articles.map((a, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: absoluteUrl(`/articles/${a.slug}/`),
        name: a.title,
      })),
    },
  };
}

export function breadcrumbSchema(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: absoluteUrl(it.path),
    })),
  };
}

export function articleSchema(article) {
  const cat = categoryBySlug(article.category);
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    inLanguage: site.lang,
    datePublished: article.published,
    dateModified: article.updated || article.published,
    author: {
      "@type": "Person",
      name: article.author?.name || site.defaultAuthor.name,
      ...(article.author?.jobTitle ? { jobTitle: article.author.jobTitle } : {}),
    },
    publisher: {
      "@type": "Organization",
      name: site.organization.name,
      logo: { "@type": "ImageObject", url: absoluteUrl(site.organization.logo) },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": absoluteUrl(`/articles/${article.slug}/`),
    },
    // 이미지는 검색 결과 썸네일과 AI 인용에 함께 쓰인다.
    // 대표 이미지는 설명이 붙은 ImageObject 로, 나머지는 주소만 넣는다.
    ...(article.images?.length
      ? {
          image: [
            imageObject(article.cover, article.coverAlt, article.coverCaption) ||
              absoluteImage(article.images[0]),
            ...article.images.slice(1).map((i) => absoluteImage(i)),
          ].filter(Boolean),
        }
      : {}),
    ...(cat ? { articleSection: cat.name } : {}),
    ...(article.keywords?.length ? { keywords: article.keywords.join(", ") } : {}),
  };
}

export function faqSchema(faq) {
  if (!faq || !faq.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((q) => ({
      "@type": "Question",
      name: q.q,
      acceptedAnswer: { "@type": "Answer", text: q.a },
    })),
  };
}

export function JsonLd({ data }) {
  if (!data) return null;
  const list = Array.isArray(data) ? data.filter(Boolean) : [data];
  return (
    <>
      {list.map((d, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(d) }}
        />
      ))}
    </>
  );
}
