// ─────────────────────────────────────────────────────────────
// 사이트 설정.
//
// 실제 값은 content/settings.json 에 들어 있고, 관리자 페이지(/admin)에서
// 브라우저로 고칠 수 있다. 이 파일은 그 값을 읽어 쓰기 좋게 정리만 한다.
// ─────────────────────────────────────────────────────────────
import settings from "@/content/settings.json";

/** #rrggbb → [r,g,b] */
function toRgb(hex) {
  const h = String(hex || "").replace("#", "").trim();
  if (h.length !== 6) return [31, 111, 92];
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}

function toHex([r, g, b]) {
  return "#" + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
}

/** 흰색 쪽으로 t(0~1) 만큼 섞는다 */
function lighten(hex, t) {
  const c = toRgb(hex);
  return toHex(c.map((v) => v + (255 - v) * t));
}

/** 검정 쪽으로 t(0~1) 만큼 섞는다 */
function darken(hex, t) {
  const c = toRgb(hex);
  return toHex(c.map((v) => v * (1 - t)));
}

/** 브랜드 색 하나로 화면 전체에 쓸 색을 만든다 */
export function brandPalette(hex) {
  const base = /^#[0-9a-fA-F]{6}$/.test(hex || "") ? hex : "#1f6f5c";
  return {
    accent: base,
    accentDark: darken(base, 0.22),
    accentSoft: lighten(base, 0.9),
    accentLine: lighten(base, 0.72),
  };
}

export const site = {
  // 주소는 환경변수가 있으면 그쪽을 우선한다 (Vercel 배포용).
  // 한글 도메인은 퓨니코드(xn--...)로 적어야 각종 태그가 안전하게 동작한다.
  url: (process.env.NEXT_PUBLIC_SITE_URL || settings.url || "").replace(/\/+$/, ""),

  name: settings.name,
  // 홈 화면 검색 제목을 직접 정하고 싶을 때. 비우면 키워드로 자동 생성
  homeTitle: settings.homeTitle || "",
  shortName: settings.shortName,
  tagline: settings.tagline,
  description: settings.description,

  locale: "ko_KR",
  lang: "ko",

  // 브랜드 색 하나로 배지, 버튼, 링크, 강조선이 전부 정해진다
  brandColor: settings.brandColor || "#1f6f5c",

  logo: settings.logo || "",
  heroImage: settings.heroImage || "",
  // 대표 이미지를 안 넣은 글에 공통으로 깔리는 사진
  coverDefault: settings.coverDefault || "",
  ogImage: settings.ogImage || "",

  // 사이트 전체를 대표하는 키워드. 구조화 데이터에 들어간다
  keywords: Array.isArray(settings.keywords)
    ? settings.keywords.filter(Boolean)
    : String(settings.keywords || "")
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean),

  // 상단 메뉴. 비우면 키워드와 분류를 전부 한 줄로 늘어놓는다
  nav: Array.isArray(settings.nav) ? settings.nav : [],

  // 메뉴 아래에 깔리는 행사 띠. image 가 비어 있으면 안 나온다
  promo: settings.promo || {},
  // 본 사이트로 보내는 버튼 문구. 쇼핑몰이면 "공식몰", 병원이면 "홈페이지" 처럼 바꾼다
  mainLink: {
    label: settings.mainLink?.label || "공식몰",
    note: settings.mainLink?.note || "제품 정보와 구매는 공식몰에서 확인하세요",
    contactTitle: settings.mainLink?.contactTitle || "고객센터",
    about: settings.mainLink?.about || "제품 사용과 관리에 관한 정보를 제공합니다.",
  },

  organization: settings.organization || {},
  defaultAuthor: settings.defaultAuthor || {},
  // 푸터에 들어가는 사업자 정보
  business: settings.business || {},

  // 네이버 서치어드바이저 / 구글 서치콘솔 소유확인 코드.
  // 값은 Vercel 환경변수에 넣는다 (가이드 6단계 참고)
  verification: {
    naver: process.env.NEXT_PUBLIC_NAVER_VERIFY || "",
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFY || "",
  },
};

export const palette = brandPalette(site.brandColor);

export const categories = settings.categories || [];

export function categoryBySlug(slug) {
  return categories.find((c) => c.slug === slug) || null;
}

export function absoluteUrl(path = "/") {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${site.url}${p}`;
}
