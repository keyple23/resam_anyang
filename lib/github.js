// ─────────────────────────────────────────────────────────────
// 관리자 페이지에서 GitHub 저장소를 직접 읽고 쓰는 얇은 클라이언트.
//
// 브라우저에서만 돌아간다. 토큰은 이 브라우저의 로컬 저장소에만 남고
// 서버로 보내지 않는다.
// ─────────────────────────────────────────────────────────────

const API = "https://api.github.com";

export function loadConfig() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("admin.github");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveConfig(cfg) {
  localStorage.setItem("admin.github", JSON.stringify(cfg));
}

export function clearConfig() {
  localStorage.removeItem("admin.github");
}

function headers(cfg) {
  return {
    Authorization: `Bearer ${cfg.token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

function base(cfg) {
  return `${API}/repos/${cfg.owner}/${cfg.repo}/contents`;
}

/** UTF-8 문자열 → base64 */
export function toBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
}

/** base64 → UTF-8 문자열 */
export function fromBase64(b64) {
  const bin = atob(b64.replace(/\n/g, ""));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

async function req(url, cfg, init = {}) {
  const res = await fetch(url, { ...init, headers: { ...headers(cfg), ...(init.headers || {}) } });
  if (res.status === 404) return null;
  if (!res.ok) {
    let msg = `${res.status}`;
    try {
      const j = await res.json();
      if (j.message) msg = j.message;
    } catch {}
    throw new Error(msg);
  }
  return res.json();
}

/** 저장소 접근이 되는지 확인 */
export async function checkAccess(cfg) {
  const res = await fetch(`${API}/repos/${cfg.owner}/${cfg.repo}`, { headers: headers(cfg) });
  if (res.status === 401) throw new Error("토큰이 올바르지 않습니다.");
  if (res.status === 404) throw new Error("저장소를 찾을 수 없습니다. 사용자명과 저장소 이름을 확인하세요.");
  if (!res.ok) throw new Error(`접근 실패 (${res.status})`);
  const j = await res.json();
  return { branch: cfg.branch || j.default_branch || "main" };
}

/** 폴더 목록 */
export async function listDir(cfg, path) {
  const j = await req(`${base(cfg)}/${path}?ref=${cfg.branch}`, cfg);
  if (!j) return [];
  return Array.isArray(j) ? j : [j];
}

/** 파일 하나 읽기 → { text, sha } */
export async function readFile(cfg, path) {
  const j = await req(`${base(cfg)}/${encodeURI(path)}?ref=${cfg.branch}`, cfg);
  if (!j || !j.content) return null;
  return { text: fromBase64(j.content), sha: j.sha };
}

/** 파일 저장 (있으면 덮어쓰기) */
export async function writeFile(cfg, path, text, message, sha) {
  let useSha = sha;
  if (useSha === undefined) {
    const cur = await req(`${base(cfg)}/${encodeURI(path)}?ref=${cfg.branch}`, cfg);
    useSha = cur && cur.sha ? cur.sha : undefined;
  }
  return req(`${base(cfg)}/${encodeURI(path)}`, cfg, {
    method: "PUT",
    body: JSON.stringify({
      message: message || `관리자: ${path} 수정`,
      content: toBase64(text),
      branch: cfg.branch,
      ...(useSha ? { sha: useSha } : {}),
    }),
  });
}

/** 이진 파일(이미지) 저장. base64 문자열을 그대로 받는다 */
export async function writeBinary(cfg, path, base64, message) {
  const cur = await req(`${base(cfg)}/${encodeURI(path)}?ref=${cfg.branch}`, cfg);
  return req(`${base(cfg)}/${encodeURI(path)}`, cfg, {
    method: "PUT",
    body: JSON.stringify({
      message: message || `관리자: ${path} 업로드`,
      content: base64,
      branch: cfg.branch,
      ...(cur && cur.sha ? { sha: cur.sha } : {}),
    }),
  });
}

/** 파일 삭제 */
export async function deleteFile(cfg, path, message) {
  const cur = await req(`${base(cfg)}/${encodeURI(path)}?ref=${cfg.branch}`, cfg);
  if (!cur) return null;
  return req(`${base(cfg)}/${encodeURI(path)}`, cfg, {
    method: "DELETE",
    body: JSON.stringify({
      message: message || `관리자: ${path} 삭제`,
      sha: cur.sha,
      branch: cfg.branch,
    }),
  });
}

/** 파일 여러 개를 한 번의 커밋으로 저장한다 (Git Data API) */
export async function writeMany(cfg, files, message) {
  // files: [{ path, text }] 또는 [{ path, base64 }]
  const refUrl = `${API}/repos/${cfg.owner}/${cfg.repo}/git/ref/heads/${cfg.branch}`;
  const ref = await req(refUrl, cfg);
  const headSha = ref.object.sha;
  const commit = await req(`${API}/repos/${cfg.owner}/${cfg.repo}/git/commits/${headSha}`, cfg);

  const tree = [];
  for (const f of files) {
    const blob = await req(`${API}/repos/${cfg.owner}/${cfg.repo}/git/blobs`, cfg, {
      method: "POST",
      body: JSON.stringify(
        f.base64
          ? { content: f.base64, encoding: "base64" }
          : { content: f.text, encoding: "utf-8" }
      ),
    });
    tree.push({ path: f.path, mode: "100644", type: "blob", sha: blob.sha });
  }

  const newTree = await req(`${API}/repos/${cfg.owner}/${cfg.repo}/git/trees`, cfg, {
    method: "POST",
    body: JSON.stringify({ base_tree: commit.tree.sha, tree }),
  });

  const newCommit = await req(`${API}/repos/${cfg.owner}/${cfg.repo}/git/commits`, cfg, {
    method: "POST",
    body: JSON.stringify({
      message: message || "관리자: 변경사항 저장",
      tree: newTree.sha,
      parents: [headSha],
    }),
  });

  return req(`${API}/repos/${cfg.owner}/${cfg.repo}/git/refs/heads/${cfg.branch}`, cfg, {
    method: "PATCH",
    body: JSON.stringify({ sha: newCommit.sha }),
  });
}

/** 이미지 파일을 data URL 로 읽는다 (재배포 전 미리보기용) */
export async function readImageDataUrl(cfg, path) {
  const j = await req(`${base(cfg)}/${encodeURI(path)}?ref=${cfg.branch}`, cfg);
  if (!j || !j.content) return null;
  const ext = path.split(".").pop().toLowerCase();
  const mime =
    ext === "png" ? "image/png"
    : ext === "svg" ? "image/svg+xml"
    : ext === "webp" ? "image/webp"
    : ext === "gif" ? "image/gif"
    : "image/jpeg";
  return `data:${mime};base64,${j.content.replace(/\n/g, "")}`;
}
