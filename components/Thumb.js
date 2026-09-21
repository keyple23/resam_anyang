import { site } from "@/lib/site";
import { normalizeImage } from "@/lib/images";
import BrandPanel from "@/components/BrandPanel";

// 이미지 순서
//  1) 글에 지정한 대표 이미지
//  2) 설정에 공통 기본 사진이 있으면 그 사진
//  3) 둘 다 없으면 브랜드 색 한 톤으로 깔고 로고와 제목을 올린다

export default function Thumb({ src, alt = "", label = "", size = "card" }) {
  const url = normalizeImage(src) || normalizeImage(site.coverDefault);
  const cls = size === "wide" ? "thumb thumb-wide" : "thumb";

  if (url) {
    return (
      <span className={cls}>
        <img src={url} alt={alt} loading="lazy" decoding="async" />
      </span>
    );
  }

  return (
    <span className={`${cls} thumb-brand`}>
      <BrandPanel label={label} size={size} />
    </span>
  );
}
