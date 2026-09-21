// ─────────────────────────────────────────────────────────────
// 이미지 처리. 글에 이미지를 넣는 모든 경로가 여기를 지난다.
//
// 마크다운에서는 이렇게만 쓰면 된다.
//   ![대체텍스트](파일이름.jpg "사진 밑에 붙을 설명")
// public/images/ 안에 있는 파일이면 파일명만 적어도 된다.
// ─────────────────────────────────────────────────────────────
import fs from "node:fs";
import path from "node:path";
import { absoluteUrl } from "./site";

const PUBLIC_DIR = path.join(process.cwd(), "public");

/**
 * public 폴더에 그 파일이 실제로 있는지 확인한다.
 * 설정이나 글에 적힌 파일명이 지워진 파일을 가리키면
 * 화면에 깨진 이미지 아이콘이 뜬다. 그럴 바엔 없는 것으로 친다.
 */
function fileExists(urlPath) {
  try {
    return fs.existsSync(path.join(PUBLIC_DIR, decodeURIComponent(urlPath)));
  } catch {
    return false;
  }
}

/** 파일명만 적어도 /images/ 아래를 찾도록 경로를 맞춰준다 */
export function normalizeImage(src) {
  if (!src) return null;
  const s = String(src).trim();
  if (!s) return null;
  if (/^(https?:)?\/\//.test(s)) return s; // 외부 주소
  const p = s.startsWith("/") ? s : `/images/${s}`;
  // 없는 파일이면 아예 이미지가 없는 것으로 처리한다
  return fileExists(p) ? p : null;
}

/** JSON-LD·오픈그래프에 넣을 전체 주소 */
export function absoluteImage(src) {
  const url = normalizeImage(src);
  if (!url) return null;
  return /^(https?:)?\/\//.test(url) ? url : absoluteUrl(url);
}

/** 구조화 데이터용 ImageObject. AI가 이미지의 의미를 문장으로 읽어간다 */
export function imageObject(src, alt, caption) {
  const url = absoluteImage(src);
  if (!url) return null;
  return {
    "@type": "ImageObject",
    url,
    contentUrl: url,
    ...(alt ? { name: alt } : {}),
    ...(caption ? { caption } : {}),
  };
}

/** 본문 마크다운에 들어간 이미지 경로를 전부 뽑는다 */
export function extractImages(md) {
  const out = [];
  const re = /!\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  let m;
  while ((m = re.exec(md))) {
    const url = normalizeImage(m[1]);
    if (url && !out.includes(url)) out.push(url);
  }
  return out;
}

function esc(s = "") {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function attrsOf(tag) {
  const get = (n) => {
    const m = tag.match(new RegExp(`\\s${n}="([^"]*)"`));
    return m ? m[1] : "";
  };
  return { src: get("src"), alt: get("alt"), title: get("title") };
}

/**
 * remark 가 뱉은 HTML의 이미지를 화면용으로 다듬는다.
 *  - 한 줄에 이미지만 있으면 figure 로 감싸고 설명을 밑에 붙인다
 *  - 지연 로딩을 걸어 첫 화면 속도를 지킨다
 *  - 파일명만 적힌 경로를 /images/ 로 맞춰준다
 */
export function enhanceImages(html) {
  if (!html) return html;

  // 1) 이미지 하나만 들어있는 문단 → figure
  let out = html.replace(
    /<p>\s*(<img\s[^>]*>)\s*(?:<em>([\s\S]*?)<\/em>)?\s*<\/p>/g,
    (_m, img, em) => {
      const { src, alt, title } = attrsOf(img);
      const url = normalizeImage(src);
      // 없는 파일이면 깨진 이미지 대신 아예 지운다
      if (!url) return "";
      const cap = (title || em || "").trim();
      return (
        `<figure class="fig">` +
        `<img src="${esc(url)}" alt="${esc(alt)}" loading="lazy" decoding="async">` +
        (cap ? `<figcaption>${cap}</figcaption>` : "") +
        `</figure>`
      );
    }
  );

  // 2) 문단 안에 섞여 있는 나머지 이미지
  out = out.replace(/<img(?![^>]*\sloading=)\s([^>]*)>/g, (_m, a) => {
    const { src, alt, title } = attrsOf(`<img ${a}>`);
    const url = normalizeImage(src);
    // 없는 파일이면 깨진 이미지 대신 아예 지운다
    if (!url) return "";
    return `<img src="${esc(url)}" alt="${esc(alt)}"${
      title ? ` title="${esc(title)}"` : ""
    } loading="lazy" decoding="async">`;
  });

  return out;
}
