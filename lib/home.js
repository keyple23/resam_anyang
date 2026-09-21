// content/home.md = 홈 화면에 통째로 올라가는 글 하나.
// 홈을 목록이 아니라 블로그 글로 보이게 만드는 파일이다.
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { site } from "./site";

const FILE = path.join(process.cwd(), "content", "home.md");

export function getHomePost() {
  if (!fs.existsSync(FILE)) return null;
  const { data, content } = matter(fs.readFileSync(FILE, "utf8"));
  const body = String(content || "").trim();
  if (!body) return null;

  return {
    title: data.title || site.homeTitle || site.tagline || site.name,
    description: data.description || site.description,
    emoji: data.emoji || "",
    published: data.published || "",
    updated: data.updated || data.published || "",
    author: data.author?.name || site.defaultAuthor?.name || "",
    tags: Array.isArray(data.tags) ? data.tags.filter(Boolean) : [],
    ctaLabel: data.ctaLabel || `${site.organization?.name || site.name} ${site.mainLink.label}에서 보기`,
    ctaUrl: data.ctaUrl || site.organization?.url || "",
    notice: data.notice || "",
    // 공식몰 줄을 글 하나에 몇 개 넣을지. 맨 끝 하나를 포함한 수
    ctaCount: Number.isFinite(Number(data.ctaCount)) ? Number(data.ctaCount) : 2,
    body,
  };
}

/**
 * 본문에 공식몰로 가는 줄을 넣는다.
 * 맨 끝에 하나를 두고, 나머지는 큰 제목 사이에 고르게 흩어 놓는다.
 * 매 문단마다 붙으면 광고처럼 보여서 오히려 안 눌린다.
 */
export function injectCta(htmlText, post) {
  if (!post?.ctaUrl) return htmlText;

  const line = `<p class="post-cta"><a href="${post.ctaUrl}">${post.ctaLabel}</a></p>`;
  const count = Math.max(0, Number(post.ctaCount) || 0);
  if (!count) return String(htmlText);

  const parts = String(htmlText).split("<h2");
  const rest = parts.slice(1);

  // 큰 제목이 없거나 하나만 넣기로 했으면 맨 끝에만
  if (count === 1 || rest.length < 2) return String(htmlText) + line;

  // 맨 끝 하나를 빼고 본문에 흩어 놓을 개수
  const inBody = Math.min(count - 1, rest.length - 1);
  const step = rest.length / (inBody + 1);
  const at = new Set();
  for (let i = 1; i <= inBody; i++) at.add(Math.round(step * i));

  let out = parts[0];
  rest.forEach((chunk, i) => {
    if (i > 0 && at.has(i)) out += line;
    out += `<h2${chunk}`;
  });
  return out + line;
}
