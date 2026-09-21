"use client";
import { useEffect, useState } from "react";
import { readImageDataUrl } from "@/lib/github";

/** 라벨 + 설명 + 입력칸 묶음 */
export function Field({ label, hint, children }) {
  return (
    <label className="adm-field">
      <span className="adm-label">{label}</span>
      {hint ? <span className="adm-hint">{hint}</span> : null}
      {children}
    </label>
  );
}

export function Text({ value, onChange, placeholder, type = "text" }) {
  return (
    <input
      className="adm-input"
      type={type}
      value={value ?? ""}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function Area({ value, onChange, rows = 4, placeholder, mono }) {
  return (
    <textarea
      className={mono ? "adm-input adm-mono" : "adm-input"}
      rows={rows}
      value={value ?? ""}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function Select({ value, onChange, options }) {
  return (
    <select className="adm-input" value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function Check({ checked, onChange, label }) {
  return (
    <label className="adm-check">
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

/**
 * 저장소 이미지를 보여준다.
 * 이미 배포된 이미지는 사이트 경로로 바로 뜨고,
 * 방금 올려서 아직 배포 전인 이미지는 저장소에서 직접 읽어 온다.
 */
export function RepoImage({ cfg, name, alt = "", className }) {
  const [src, setSrc] = useState(`/images/${name}`);
  const [state, setState] = useState("site"); // site → repo → fail

  useEffect(() => {
    setSrc(`/images/${name}`);
    setState("site");
  }, [name]);

  async function fallback() {
    if (state !== "site") {
      setState("fail");
      return;
    }
    setState("repo");
    try {
      const d = await readImageDataUrl(cfg, `public/images/${name}`);
      if (d) setSrc(d);
      else setState("fail");
    } catch {
      setState("fail");
    }
  }

  if (state === "fail") {
    return <span className={`adm-noimg ${className || ""}`}>미리보기 없음</span>;
  }
  return <img className={className} src={src} alt={alt} onError={fallback} />;
}

/** 이미지 하나를 고르는 칸. 저장소의 이미지 목록에서 클릭해 선택한다 */
export function ImagePick({ cfg, images, value, onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <div className="adm-pick-row">
        <input
          className="adm-input"
          value={value ?? ""}
          placeholder="파일명 (예: cover-1.jpg)"
          onChange={(e) => onChange(e.target.value)}
        />
        <button type="button" className="adm-btn adm-btn-ghost" onClick={() => setOpen(!open)}>
          {open ? "닫기" : "고르기"}
        </button>
        {value ? (
          <button type="button" className="adm-btn adm-btn-ghost" onClick={() => onChange("")}>
            비우기
          </button>
        ) : null}
      </div>

      {value ? (
        <div className="adm-pick-preview">
          <RepoImage cfg={cfg} name={value} alt="" />
        </div>
      ) : null}

      {open ? (
        <div className="adm-grid adm-pick-grid">
          {images.length === 0 ? (
            <p className="adm-muted">올라간 이미지가 없습니다. 이미지 탭에서 먼저 올려주세요.</p>
          ) : (
            images.map((n) => (
              <button
                type="button"
                key={n}
                className={`adm-tile ${value === n ? "on" : ""}`}
                onClick={() => {
                  onChange(n);
                  setOpen(false);
                }}
              >
                <RepoImage cfg={cfg} name={n} alt={n} />
                <span>{n}</span>
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}

/** 질문·답 같은 반복 입력 */
export function Repeater({ items, onChange, fields, addLabel = "추가" }) {
  const list = items || [];
  const set = (i, key, v) => {
    const next = list.map((it, idx) => (idx === i ? { ...it, [key]: v } : it));
    onChange(next);
  };
  return (
    <div className="adm-rep">
      {list.map((it, i) => (
        <div className="adm-rep-item" key={i}>
          {fields.map((f) =>
            f.area ? (
              <Area
                key={f.key}
                rows={2}
                value={it[f.key]}
                placeholder={f.placeholder}
                onChange={(v) => set(i, f.key, v)}
              />
            ) : (
              <Text
                key={f.key}
                value={it[f.key]}
                placeholder={f.placeholder}
                onChange={(v) => set(i, f.key, v)}
              />
            )
          )}
          <button
            type="button"
            className="adm-btn adm-btn-ghost adm-btn-sm"
            onClick={() => onChange(list.filter((_, idx) => idx !== i))}
          >
            이 줄 삭제
          </button>
        </div>
      ))}
      <button
        type="button"
        className="adm-btn adm-btn-ghost"
        onClick={() => onChange([...list, Object.fromEntries(fields.map((f) => [f.key, ""]))])}
      >
        + {addLabel}
      </button>
    </div>
  );
}

/** 여러 개를 켜고 끄는 선택 */
export function MultiPick({ options, value, onChange }) {
  const sel = value || [];
  return (
    <div className="adm-chips">
      {options.length === 0 ? <span className="adm-muted">선택할 항목이 없습니다.</span> : null}
      {options.map((o) => {
        const on = sel.includes(o.value);
        return (
          <button
            type="button"
            key={o.value}
            className={`adm-chip ${on ? "on" : ""}`}
            onClick={() =>
              onChange(on ? sel.filter((v) => v !== o.value) : [...sel, o.value])
            }
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Toast({ message, kind }) {
  if (!message) return null;
  return <div className={`adm-toast ${kind || ""}`}>{message}</div>;
}

/** 네이버 검색 결과에 어떻게 보이는지 그대로 보여준다 */
export function SerpPreview({ siteName, siteUrl, path, title, description, note, exact }) {
  const host = String(siteUrl || "").replace(/^https?:\/\//, "").replace(/\/+$/, "");
  // exact = 이 제목이 그대로 검색 결과에 나온다 (홈 화면)
  // 그 외에는 뒤에 사이트 이름이 자동으로 붙는다 (글, 키워드 페이지)
  const full = exact ? String(title || "") : title ? `${title} | ${siteName}` : siteName || "";
  const crumb = [host, ...String(path || "").split("/").filter(Boolean)].join(" › ");

  return (
    <div className="adm-serp">
      <div className="adm-serp-head">
        <span>네이버 검색 결과 미리보기</span>
        {note ? <em>{note}</em> : null}
      </div>
      <div className="adm-serp-body">
        <div className="adm-serp-title">{full || "제목을 입력하세요"}</div>
        <div className="adm-serp-url">{crumb}</div>
        <div className="adm-serp-desc">
          {description || "설명을 입력하면 여기에 나옵니다."}
        </div>
      </div>
      <div className="adm-serp-meter">
        <Meter label="제목" value={full.length} soft={35} hard={45} />
        <Meter label="설명" value={(description || "").length} soft={80} hard={100} />
      </div>
    </div>
  );
}

function Meter({ label, value, soft, hard }) {
  const state = value === 0 ? "" : value > hard ? "bad" : value > soft ? "warn" : "ok";
  const msg =
    value === 0 ? "" : value > hard ? "잘립니다" : value > soft ? "조금 깁니다" : "적당합니다";
  return (
    <span className={`adm-meter ${state}`}>
      {label} {value}자 {msg}
    </span>
  );
}

/** 홈 화면 상단이 어떻게 보이는지 축소해서 보여준다 */
export function BrandPreview({ cfg, data }) {
  return (
    <div className="adm-brand-pv">
      <div className="adm-serp-head">
        <span>홈 화면 미리보기</span>
      </div>
      <div className="adm-pv-frame">
        <div className="adm-pv-header">
          <div className="adm-pv-brand">
            <strong>{data.name || "사이트 이름"}</strong>
            <small>{data.tagline || "한 줄 소개"}</small>
          </div>
          <span className="adm-pv-cta">브랜드 사이트</span>
        </div>
        <div className="adm-pv-hero">
          {data.heroImage ? (
            <RepoImage cfg={cfg} name={data.heroImage} alt="" className="adm-pv-heroimg" />
          ) : null}
          <div className="adm-pv-hero-in">
            <h4>{data.tagline || "한 줄 소개가 여기에 크게 나옵니다"}</h4>
            <p>{data.description || "사이트 설명이 여기에 나옵니다."}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 브랜드 이미지 한눈에 보기.
 * 어느 자리에 무슨 이미지가 걸려 있는지, 없으면 없다고 보여준다.
 */
export function ImageBoard({ cfg, data }) {
  const slots = [
    { key: "logo", label: "로고", where: "헤더 가운데", value: data.logo, box: "tall" },
    { key: "promo", label: "행사 띠 (PC)", where: "메뉴 바로 아래", value: data.promo?.image, box: "wide" },
    { key: "promoMo", label: "행사 띠 (모바일)", where: "좁은 화면에서", value: data.promo?.imageMobile, box: "card" },
    { key: "heroImage", label: "홈 배경", where: "홈 글이 없을 때 상단 띠", value: data.heroImage, box: "wide" },
    { key: "coverDefault", label: "기본 커버", where: "대표 이미지 없는 글", value: data.coverDefault, box: "card" },
    { key: "ogImage", label: "공유 미리보기", where: "카카오톡·슬랙 링크", value: data.ogImage, box: "card" },
  ];

  return (
    <div className="adm-board">
      <div className="adm-serp-head">
        <span>브랜드 이미지</span>
        <em>어느 자리에 무엇이 걸려 있는지</em>
      </div>
      <div className="adm-board-grid">
        {slots.map((s) => (
          <div className="adm-board-item" key={s.key}>
            <div className={`adm-board-box adm-board-${s.box}`}>
              {s.value ? (
                <RepoImage cfg={cfg} name={s.value} alt={s.label} />
              ) : (
                <span className="adm-board-empty">없음</span>
              )}
            </div>
            <strong>{s.label}</strong>
            <small>{s.where}</small>
            <code>{s.value || "비어 있음"}</code>
          </div>
        ))}
      </div>
    </div>
  );
}
