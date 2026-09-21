// content/keywords/*.md = 노출을 노리는 키워드 하나당 파일 하나.
// 파일을 추가하면 그 키워드 전용 페이지가 자동으로 생기고
// 사이트맵, RSS, llms.txt, 홈 화면에 전부 반영된다.
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { extractImages, normalizeImage } from "./images";
import { site } from "./site";

const DIR = path.join(process.cwd(), "content", "keywords");

function readAll() {
  if (!fs.existsSync(DIR)) return [];
  return fs
    .readdirSync(DIR)
    .filter((f) => f.endsWith(".md") && !f.startsWith("_"))
    .map((file) => {
      const fallbackSlug = file.replace(/\.md$/, "");
      const raw = fs.readFileSync(path.join(DIR, file), "utf8");
      const { data, content } = matter(raw);
      return {
        slug: String(data.slug || fallbackSlug),
        keyword: data.keyword || fallbackSlug,
        // 같은 뜻으로 검색되는 표기들. 띄어쓰기 유무 등
        variants: data.variants || [],
        // 검색 결과에 그대로 뜨는 제목. 비우면 자동 생성
        title: data.title || "",
        description: data.description || "",
        // 이 키워드와 묶을 아티클 슬러그 목록
        articles: data.articles || [],
        faq: data.faq || [],
        // 대표 이미지. public/images/ 안에 있으면 파일명만 적어도 된다
        cover: normalizeImage(data.cover),
        coverAlt: data.coverAlt || data.keyword || "",
        coverCaption: data.coverCaption || "",
        images: [
          ...(normalizeImage(data.cover) ? [normalizeImage(data.cover)] : []),
          ...extractImages(content),
        ],
        priority: typeof data.priority === "number" ? data.priority : 50,
        draft: Boolean(data.draft),
        body: content,
      };
    })
    .filter((k) => !k.draft)
    .sort((a, b) => b.priority - a.priority);
}

export function getKeywords() {
  return readAll();
}

export function getKeyword(slug) {
  return readAll().find((k) => k.slug === slug) || null;
}

/** 홈 타이틀에 쓸 키워드 나열. 경쟁사들이 쓰는 패턴이다 */
export function keywordLine(limit = 3) {
  return getKeywords()
    .slice(0, limit)
    .map((k) => k.keyword)
    .join(" | ");
}

/** meta keywords 와 본문 안에서 쓸 전체 표기 목록 */
export function allKeywordTerms() {
  // 설정에 적어둔 대표 키워드를 앞에 두고, 키워드 글에서 뽑은 표기를 뒤에 붙인다
  const out = [...site.keywords];
  for (const k of getKeywords()) {
    out.push(k.keyword, ...k.variants);
  }
  return [...new Set(out.filter(Boolean))];
}
