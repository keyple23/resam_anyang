// content/articles/*.md 를 읽어서 아티클 목록과 본문을 만든다.
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { remark } from "remark";
import gfm from "remark-gfm";
import html from "remark-html";
import { enhanceImages, extractImages, normalizeImage } from "./images";

const DIR = path.join(process.cwd(), "content", "articles");

function readAll() {
  if (!fs.existsSync(DIR)) return [];
  return fs
    .readdirSync(DIR)
    .filter((f) => f.endsWith(".md"))
    .map((file) => {
      const slug = file.replace(/\.md$/, "");
      const raw = fs.readFileSync(path.join(DIR, file), "utf8");
      const { data, content } = matter(raw);
      return {
        slug,
        title: data.title || slug,
        description: data.description || "",
        category: data.category || "guide",
        author: data.author || null,
        published: data.published || "",
        updated: data.updated || data.published || "",
        keywords: data.keywords || [],
        faq: data.faq || [],
        cover: normalizeImage(data.cover),
        coverAlt: data.coverAlt || data.title || "",
        coverCaption: data.coverCaption || "",
        // 본문에 들어간 이미지까지 모아 구조화 데이터에 넣는다
        images: [
          ...(normalizeImage(data.cover) ? [normalizeImage(data.cover)] : []),
          ...extractImages(content),
        ],
        draft: Boolean(data.draft),
        body: content,
      };
    })
    .filter((a) => !a.draft)
    .sort((a, b) => (a.published < b.published ? 1 : -1));
}

export function getArticles() {
  return readAll();
}

export function getArticle(slug) {
  return readAll().find((a) => a.slug === slug) || null;
}

export function getArticlesByCategory(categorySlug) {
  return readAll().filter((a) => a.category === categorySlug);
}

/** 같은 카테고리 글을 먼저, 부족하면 최신 글로 채운다 */
export function getRelated(article, limit = 4) {
  const all = readAll().filter((a) => a.slug !== article.slug);
  const same = all.filter((a) => a.category === article.category);
  const rest = all.filter((a) => a.category !== article.category);
  return [...same, ...rest].slice(0, limit);
}

export async function renderMarkdown(md) {
  const file = await remark().use(gfm).use(html, { sanitize: false }).process(md);
  return enhanceImages(String(file));
}

/** 본문 h2 를 뽑아 목차를 만든다 */
export function extractHeadings(md) {
  return md
    .split("\n")
    .filter((l) => l.startsWith("## "))
    .map((l) => {
      const text = l.replace(/^##\s+/, "").trim();
      return { text, id: slugifyHeading(text) };
    });
}

export function slugifyHeading(text) {
  return text
    .toLowerCase()
    .replace(/[^가-힣a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

/** 읽는 데 걸리는 시간 (분) */
export function readingMinutes(md) {
  const chars = md.replace(/\s+/g, "").length;
  return Math.max(1, Math.round(chars / 500));
}
