"use client";

import { useCallback, useEffect, useState } from "react";
import "./admin.css";
import {
  checkAccess,
  clearConfig,
  deleteFile,
  listDir,
  loadConfig,
  readFile,
  saveConfig,
  writeBinary,
  writeFile,
} from "@/lib/github";
import { buildFM, parseFM, safeFileName, today } from "@/lib/frontmatter";
import { Field, Text, Toast } from "./parts";
import { ArticleForm, HomeForm, ImageManager, KeywordForm, SettingsForm } from "./editors";

const TABS = [
  { key: "home", label: "홈 글" },
  { key: "keywords", label: "키워드" },
  { key: "articles", label: "글" },
  { key: "images", label: "이미지" },
  { key: "settings", label: "브랜드 설정" },
  { key: "help", label: "도움말" },
];

export default function AdminPage() {
  const [cfg, setCfg] = useState(null);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState("keywords");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const [keywords, setKeywords] = useState([]);
  const [articles, setArticles] = useState([]);
  const [images, setImages] = useState([]);
  const [settings, setSettings] = useState(null);
  const [home, setHome] = useState(null);
  const [edit, setEdit] = useState(null);

  useEffect(() => {
    setCfg(loadConfig());
    setReady(true);
  }, []);

  const toast = (text, kind) => {
    setMsg({ text, kind });
    setTimeout(() => setMsg(null), 4000);
  };

  const loadAll = useCallback(async (c) => {
    setBusy(true);
    try {
      const [kwFiles, arFiles, imgFiles, setFile, homeFile] = await Promise.all([
        listDir(c, "content/keywords"),
        listDir(c, "content/articles"),
        listDir(c, "public/images"),
        readFile(c, "content/settings.json"),
        readFile(c, "content/home.md"),
      ]);

      const readMd = async (entries, dir) => {
        const names = entries
          .filter((e) => e.type === "file" && e.name.endsWith(".md") && !e.name.startsWith("_"))
          .map((e) => e.name);
        const out = [];
        for (const n of names) {
          const f = await readFile(c, `${dir}/${n}`);
          if (!f) continue;
          const { data, body } = parseFM(f.text);
          out.push({ file: n.replace(/\.md$/, ""), data, body });
        }
        return out;
      };

      setKeywords(await readMd(kwFiles, "content/keywords"));
      setArticles(await readMd(arFiles, "content/articles"));
      setImages(
        imgFiles
          .filter((e) => e.type === "file" && /\.(jpe?g|png|webp|gif|svg|avif)$/i.test(e.name))
          .map((e) => e.name)
          .sort()
      );
      setSettings(setFile ? JSON.parse(setFile.text) : null);
      if (homeFile) {
        const { data, body } = parseFM(homeFile.text);
        setHome({ data, body });
      } else {
        setHome({ data: {}, body: "" });
      }
    } catch (e) {
      toast(`불러오지 못했습니다: ${e.message}`, "bad");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    if (cfg) loadAll(cfg);
  }, [cfg, loadAll]);

  if (!ready) return null;
  if (!cfg) return <Login onDone={(c) => setCfg(c)} />;

  // ── 저장 동작들 ──────────────────────────────────────
  async function saveMd(kind) {
    const dir = kind === "keywords" ? "content/keywords" : "content/articles";
    const name = (edit.file || "").trim();
    if (!/^[a-z0-9-]+$/.test(name)) {
      toast("파일 이름은 영문 소문자, 숫자, 하이픈만 쓸 수 있습니다.", "bad");
      return;
    }
    setBusy(true);
    try {
      const text = buildFM(edit.data, edit.body);
      await writeFile(cfg, `${dir}/${name}.md`, text, `관리자: ${name} 저장`);
      if (edit.orig && edit.orig !== name) {
        await deleteFile(cfg, `${dir}/${edit.orig}.md`, `관리자: ${edit.orig} 이름 변경`);
      }
      setEdit(null);
      await loadAll(cfg);
      toast("저장했습니다. 1~2분 뒤 사이트에 반영됩니다.", "ok");
    } catch (e) {
      toast(`저장 실패: ${e.message}`, "bad");
    } finally {
      setBusy(false);
    }
  }

  async function saveHome() {
    setBusy(true);
    try {
      await writeFile(cfg, "content/home.md", buildFM(home.data, home.body), "관리자: 홈 글 저장");
      await loadAll(cfg);
      toast("저장했습니다. 1~2분 뒤 사이트에 반영됩니다.", "ok");
    } catch (e) {
      toast(`저장 실패: ${e.message}`, "bad");
    } finally {
      setBusy(false);
    }
  }

  async function removeMd(kind, name) {
    if (!confirm(`${name} 을(를) 삭제할까요? 되돌릴 수 없습니다.`)) return;
    const dir = kind === "keywords" ? "content/keywords" : "content/articles";
    setBusy(true);
    try {
      await deleteFile(cfg, `${dir}/${name}.md`);
      setEdit(null);
      await loadAll(cfg);
      toast("삭제했습니다.", "ok");
    } catch (e) {
      toast(`삭제 실패: ${e.message}`, "bad");
    } finally {
      setBusy(false);
    }
  }

  async function uploadImages(files) {
    setBusy(true);
    try {
      for (const f of files) {
        const b64 = await new Promise((res, rej) => {
          const r = new FileReader();
          r.onload = () => res(String(r.result).split(",")[1]);
          r.onerror = rej;
          r.readAsDataURL(f);
        });
        await writeBinary(cfg, `public/images/${safeFileName(f.name)}`, b64);
      }
      await loadAll(cfg);
      toast(`${files.length}장 올렸습니다. 1~2분 뒤 사이트에 반영됩니다.`, "ok");
    } catch (e) {
      toast(`업로드 실패: ${e.message}`, "bad");
    } finally {
      setBusy(false);
    }
  }

  async function removeImage(name) {
    if (!confirm(`${name} 을(를) 삭제할까요? 이 이미지를 쓰는 글이 있으면 빈칸이 됩니다.`)) return;
    setBusy(true);
    try {
      await deleteFile(cfg, `public/images/${name}`);
      await loadAll(cfg);
      toast("삭제했습니다.", "ok");
    } catch (e) {
      toast(`삭제 실패: ${e.message}`, "bad");
    } finally {
      setBusy(false);
    }
  }

  async function saveSettings() {
    setBusy(true);
    try {
      await writeFile(
        cfg,
        "content/settings.json",
        JSON.stringify(settings, null, 2) + "\n",
        "관리자: 브랜드 설정 저장"
      );
      toast("저장했습니다. 1~2분 뒤 사이트에 반영됩니다.", "ok");
    } catch (e) {
      toast(`저장 실패: ${e.message}`, "bad");
    } finally {
      setBusy(false);
    }
  }

  const cats = settings?.categories || [];

  // ── 화면 ────────────────────────────────────────────
  return (
    <div className="adm">
      <header className="adm-top">
        <div className="adm-top-in">
          <strong>{settings?.name || "관리자"}</strong>
          <nav className="adm-tabs">
            {TABS.map((t) => (
              <button
                key={t.key}
                className={tab === t.key ? "on" : ""}
                onClick={() => {
                  setTab(t.key);
                  setEdit(null);
                }}
              >
                {t.label}
              </button>
            ))}
          </nav>
          <div className="adm-spacer" />
          <a className="adm-btn adm-btn-ghost adm-btn-sm" href="/" target="_blank" rel="noreferrer">
            사이트 보기
          </a>
          <button className="adm-btn adm-btn-ghost adm-btn-sm" onClick={() => loadAll(cfg)}>
            새로고침
          </button>
          <button
            className="adm-btn adm-btn-ghost adm-btn-sm"
            onClick={() => {
              clearConfig();
              setCfg(null);
            }}
          >
            로그아웃
          </button>
        </div>
      </header>

      <main className="adm-main">
        {busy ? <div className="adm-bar" /> : null}

        {tab === "keywords" &&
          (edit && edit.kind === "keywords" ? (
            <Editor
              title={edit.orig ? "키워드 수정" : "새 키워드"}
              onBack={() => setEdit(null)}
              onSave={() => saveMd("keywords")}
              onDelete={edit.orig ? () => removeMd("keywords", edit.orig) : null}
              busy={busy}
            >
              <KeywordForm
                cfg={cfg}
                site={settings || {}}
                images={images}
                articles={articles.map((a) => ({ slug: a.file, title: a.data.title }))}
                file={edit.file}
                data={edit.data}
                body={edit.body}
                onFile={(v) => setEdit({ ...edit, file: v })}
                onChange={(k, v) => setEdit({ ...edit, data: { ...edit.data, [k]: v } })}
                onBody={(v) => setEdit({ ...edit, body: v })}
              />
            </Editor>
          ) : (
            <List
              heading="키워드"
              lead="노출을 노리는 키워드 하나가 항목 하나입니다. 우선순위가 높은 3개가 홈 제목에 들어갑니다."
              addLabel="새 키워드"
              onAdd={() =>
                setEdit({
                  kind: "keywords",
                  orig: null,
                  file: "",
                  body: "",
                  data: { priority: 50, variants: [], articles: [], faq: [] },
                })
              }
              items={[...keywords]
                .sort((a, b) => (b.data.priority || 0) - (a.data.priority || 0))
                .map((k) => ({
                  key: k.file,
                  title: k.data.keyword || k.file,
                  sub: k.data.title || k.data.description,
                  tag: `우선순위 ${k.data.priority ?? 50}`,
                  draft: k.data.draft,
                  onClick: () =>
                    setEdit({ kind: "keywords", orig: k.file, file: k.file, data: k.data, body: k.body }),
                }))}
            />
          ))}

        {tab === "articles" &&
          (edit && edit.kind === "articles" ? (
            <Editor
              title={edit.orig ? "글 수정" : "새 글"}
              onBack={() => setEdit(null)}
              onSave={() => saveMd("articles")}
              onDelete={edit.orig ? () => removeMd("articles", edit.orig) : null}
              busy={busy}
            >
              <ArticleForm
                cfg={cfg}
                site={settings || {}}
                images={images}
                categories={cats}
                file={edit.file}
                data={edit.data}
                body={edit.body}
                onFile={(v) => setEdit({ ...edit, file: v })}
                onChange={(k, v) => setEdit({ ...edit, data: { ...edit.data, [k]: v } })}
                onBody={(v) => setEdit({ ...edit, body: v })}
              />
            </Editor>
          ) : (
            <List
              heading="글"
              lead="키워드 하나에 글 하나를 붙입니다. 15편 이상 쌓여야 순위가 움직입니다."
              addLabel="새 글"
              onAdd={() =>
                setEdit({
                  kind: "articles",
                  orig: null,
                  file: "",
                  body: "",
                  data: {
                    category: cats[0]?.slug || "guide",
                    published: today(),
                    updated: today(),
                    keywords: [],
                    faq: [],
                    author: { name: settings?.defaultAuthor?.name || "" },
                  },
                })
              }
              items={[...articles]
                .sort((a, b) => String(b.data.published).localeCompare(String(a.data.published)))
                .map((a) => ({
                  key: a.file,
                  title: a.data.title || a.file,
                  sub: a.data.description,
                  tag: a.data.published,
                  draft: a.data.draft,
                  onClick: () =>
                    setEdit({ kind: "articles", orig: a.file, file: a.file, data: a.data, body: a.body }),
                }))}
            />
          ))}

        {tab === "images" && (
          <section className="adm-panel">
            <h2>이미지</h2>
            <p className="adm-lead">
              여기에 올린 이미지는 글과 키워드에서 파일명만으로 불러 쓸 수 있습니다.
            </p>
            <ImageManager
              cfg={cfg}
              images={images}
              busy={busy}
              onUpload={uploadImages}
              onDelete={removeImage}
            />
          </section>
        )}

        {tab === "home" && home && (
          <section className="adm-panel">
            <div className="adm-panel-head">
              <div>
                <h2>홈 글</h2>
                <p className="adm-lead">
                  홈 화면에 통째로 올라가는 글입니다. 내용을 비우면 홈이 글 목록으로 바뀝니다.
                </p>
              </div>
              <button className="adm-btn" onClick={saveHome} disabled={busy}>
                저장
              </button>
            </div>
            <HomeForm
              cfg={cfg}
              site={settings}
              data={home.data}
              body={home.body}
              onChange={(d) => setHome({ ...home, data: d })}
              onBody={(v) => setHome({ ...home, body: v })}
            />
            <div className="adm-foot">
              <button className="adm-btn" onClick={saveHome} disabled={busy}>
                저장
              </button>
            </div>
          </section>
        )}

        {tab === "settings" && settings && (
          <section className="adm-panel">
            <div className="adm-panel-head">
              <div>
                <h2>브랜드 설정</h2>
                <p className="adm-lead">사이트 이름, 설명, 분류를 바꿉니다.</p>
              </div>
              <button className="adm-btn" onClick={saveSettings} disabled={busy}>
                저장
              </button>
            </div>
            <SettingsForm cfg={cfg} images={images} data={settings} onChange={setSettings} />
            <div className="adm-foot">
              <button className="adm-btn" onClick={saveSettings} disabled={busy}>
                저장
              </button>
            </div>
          </section>
        )}

        {tab === "help" && <Help cfg={cfg} />}
      </main>

      <Toast message={msg?.text} kind={msg?.kind} />
    </div>
  );
}

// ── 목록 ──────────────────────────────────────────────
function List({ heading, lead, items, onAdd, addLabel }) {
  return (
    <section className="adm-panel">
      <div className="adm-panel-head">
        <div>
          <h2>{heading}</h2>
          <p className="adm-lead">{lead}</p>
        </div>
        <button className="adm-btn" onClick={onAdd}>
          + {addLabel}
        </button>
      </div>
      {items.length === 0 ? (
        <p className="adm-muted">아직 없습니다. 오른쪽 위 버튼으로 추가하세요.</p>
      ) : (
        <ul className="adm-list">
          {items.map((it) => (
            <li key={it.key}>
              <button onClick={it.onClick}>
                <span className="adm-list-title">
                  {it.title}
                  {it.draft ? <em className="adm-badge">작성 중</em> : null}
                </span>
                <span className="adm-list-sub">{it.sub}</span>
                <span className="adm-list-tag">{it.tag}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ── 편집 틀 ────────────────────────────────────────────
function Editor({ title, children, onBack, onSave, onDelete, busy }) {
  return (
    <section className="adm-panel">
      <div className="adm-panel-head">
        <div>
          <button className="adm-back" onClick={onBack}>
            ← 목록으로
          </button>
          <h2>{title}</h2>
        </div>
        <div className="adm-actions">
          {onDelete ? (
            <button className="adm-btn adm-btn-ghost adm-danger" onClick={onDelete} disabled={busy}>
              삭제
            </button>
          ) : null}
          <button className="adm-btn" onClick={onSave} disabled={busy}>
            저장
          </button>
        </div>
      </div>
      {children}
      <div className="adm-foot">
        <button className="adm-btn" onClick={onSave} disabled={busy}>
          저장
        </button>
      </div>
    </section>
  );
}

// ── 로그인 ────────────────────────────────────────────
function Login({ onDone }) {
  const [owner, setOwner] = useState("");
  const [repo, setRepo] = useState("");
  const [token, setToken] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr("");
    if (!owner.trim()) return setErr("GitHub 사용자명을 입력하세요. 회색 글씨는 예시입니다.");
    if (!repo.trim()) return setErr("저장소 이름을 입력하세요. 회색 글씨는 예시입니다.");
    if (!token.trim()) return setErr("액세스 토큰을 붙여넣으세요.");
    setBusy(true);
    try {
      const cfg = { owner: owner.trim(), repo: repo.trim(), token: token.trim(), branch: "main" };
      const { branch } = await checkAccess(cfg);
      cfg.branch = branch;
      saveConfig(cfg);
      onDone(cfg);
    } catch (e2) {
      setErr(
        /failed to fetch/i.test(e2.message)
          ? "GitHub에 연결하지 못했습니다. 사용자명과 저장소 이름을 다시 확인해주세요."
          : e2.message
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="adm adm-login">
      <form className="adm-card" onSubmit={submit}>
        <h1>관리자 로그인</h1>
        <p className="adm-lead">
          이 사이트의 GitHub 저장소에 연결합니다. 입력한 값은 이 브라우저에만 저장되고
          서버로 보내지 않습니다.
        </p>

        <Field label="GitHub 사용자명" hint="저장소 주소의 github.com/여기/저장소이름">
          <Text value={owner} onChange={setOwner} placeholder="keyple23" />
        </Field>
        <Field label="저장소 이름">
          <Text value={repo} onChange={setRepo} placeholder="welcomedrink" />
        </Field>
        <Field
          label="액세스 토큰"
          hint="GitHub → Settings → Developer settings → Personal access tokens (자세한 절차는 아래)"
        >
          <Text type="password" value={token} onChange={setToken} placeholder="github_pat_..." />
        </Field>

        {err ? <p className="adm-err">{err}</p> : null}

        <button className="adm-btn adm-btn-wide" disabled={busy}>
          {busy ? "확인 중…" : "연결하기"}
        </button>

        <details className="adm-help">
          <summary>토큰은 어디서 받나요</summary>
          <ol>
            <li>github.com 오른쪽 위 프로필 사진 → Settings</li>
            <li>왼쪽 맨 아래 Developer settings</li>
            <li>Personal access tokens → Fine-grained tokens → Generate new token</li>
            <li>Token name 은 아무거나, Expiration 은 원하는 기간으로</li>
            <li>Repository access 에서 Only select repositories → 이 사이트 저장소 선택</li>
            <li>
              Permissions → Repository permissions → <b>Contents</b> 를 <b>Read and write</b> 로
            </li>
            <li>Generate token → 나온 값을 복사해서 위에 붙여넣기</li>
          </ol>
          <p>
            토큰은 한 번만 보여줍니다. 창을 닫기 전에 복사하세요.
            잃어버리면 새로 만들면 됩니다.
          </p>
        </details>
      </form>
    </div>
  );
}

// ── 도움말 ────────────────────────────────────────────
function Help({ cfg }) {
  return (
    <section className="adm-panel adm-prose">
      <h2>도움말</h2>

      <h3>저장하면 어떻게 되나요</h3>
      <p>
        저장하면 GitHub 저장소에 바로 반영되고, Vercel이 그걸 감지해서 사이트를 다시 만듭니다.
        보통 1~2분 걸립니다. 바로 안 보이면 잠시 뒤 새로고침하세요.
      </p>

      <h3>글을 새로 올린 뒤 꼭 할 일</h3>
      <p>
        네이버 서치어드바이저 → 요청 → 웹페이지 수집에 그 글 주소를 넣으세요.
        색인이 눈에 띄게 빨라집니다. 글 하나 올릴 때마다 습관처럼 하시면 됩니다.
      </p>
      <p>
        <a href="https://searchadvisor.naver.com" target="_blank" rel="noreferrer">
          searchadvisor.naver.com 열기
        </a>
      </p>

      <h3>이미지 설명을 꼭 채워야 하는 이유</h3>
      <p>
        검색엔진과 AI는 사진을 보지 못합니다. 이미지 설명 문장만 읽고 내용을 판단합니다.
        비워두면 이미지를 안 넣은 것과 같습니다.
      </p>

      <h3>글쓰기 규칙 요약</h3>
      <ol>
        <li>첫 문단에서 결론부터. 배경 설명은 뒤로</li>
        <li>소제목은 고객이 던지는 질문 형태로</li>
        <li>소제목 바로 아래 두세 문장으로 답부터</li>
        <li>비교할 게 있으면 표로. AI가 표를 그대로 가져갑니다</li>
        <li>확인되는 숫자만. 없는 숫자는 만들지 않습니다</li>
        <li>타겟 키워드를 제목, 첫 문단, 소제목 하나에</li>
        <li>다른 글로 가는 링크를 본문에 하나 이상</li>
      </ol>

      <h3>본문에 쓸 수 있는 표기</h3>
      <pre>{`## 소제목
**굵게**   [링크](주소)

- 목록
1. 번호 목록

| 항목 | A | B |
|---|---|---|
| 내용 | 내용 | 내용 |

![이미지 설명](파일명.jpg "사진 밑에 붙는 설명")`}</pre>

      <h3>연결된 저장소</h3>
      <p className="adm-muted">
        {cfg.owner}/{cfg.repo} ({cfg.branch})
      </p>
    </section>
  );
}
