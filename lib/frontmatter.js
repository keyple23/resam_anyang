// 마크다운 파일 맨 위의 설정 블록을 읽고 쓴다. 관리자 페이지에서 쓴다.
import yaml from "js-yaml";

export function parseFM(text = "") {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { data: {}, body: text };
  let data = {};
  try {
    data = yaml.load(m[1]) || {};
  } catch {
    data = {};
  }
  return { data, body: m[2] || "" };
}

export function buildFM(data, body = "") {
  const clean = {};
  for (const [k, v] of Object.entries(data)) {
    if (v === "" || v === null || v === undefined) continue;
    if (Array.isArray(v) && v.length === 0) continue;
    clean[k] = v;
  }
  const head = yaml.dump(clean, { lineWidth: -1, noRefs: true, quotingType: '"' }).trimEnd();
  return `---\n${head}\n---\n\n${body.trim()}\n`;
}

/** "a, b, c" → ["a","b","c"] */
export function splitList(s = "") {
  return String(s)
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

export const today = () => new Date().toISOString().slice(0, 10);

/** 업로드 파일명을 안전하게 다듬는다 */
export function safeFileName(name = "") {
  const dot = name.lastIndexOf(".");
  const ext = dot > -1 ? name.slice(dot).toLowerCase() : "";
  let base = (dot > -1 ? name.slice(0, dot) : name)
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  if (!base) base = `img-${Date.now()}`;
  return base + (ext || ".jpg");
}
