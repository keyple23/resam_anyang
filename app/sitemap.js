import { site, categories } from "@/lib/site";
import { getArticles } from "@/lib/articles";
import { getKeywords } from "@/lib/keywords";
import { absoluteImage } from "@/lib/images";

/** 사이트맵에 이미지 주소도 같이 실어 보낸다 */
function imgs(list) {
  const out = (list || []).map((i) => absoluteImage(i)).filter(Boolean);
  return out.length ? { images: out } : {};
}

export default function sitemap() {
  const now = new Date();
  const articles = getArticles();

  return [
    { url: `${site.url}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${site.url}/about/`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    ...getKeywords().map((k) => ({
      url: `${site.url}/keywords/${encodeURI(k.slug)}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
      ...imgs(k.images),
    })),
    ...categories.map((c) => ({
      url: `${site.url}/category/${c.slug}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    })),
    ...articles.map((a) => ({
      url: `${site.url}/articles/${a.slug}/`,
      lastModified: new Date(a.updated || a.published || now),
      changeFrequency: "monthly",
      priority: 0.8,
      ...imgs(a.images),
    })),
  ];
}
