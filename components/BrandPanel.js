import { site } from "@/lib/site";
import { normalizeImage } from "@/lib/images";

/**
 * 사진이 없을 때 대신 깔리는 브랜드 판.
 * 무늬나 그라데이션 없이 브랜드 색 한 톤만 쓰고, 그 위에 로고와 제목을 올린다.
 */
export default function BrandPanel({ label = "", size = "card" }) {
  const logo = normalizeImage(site.logo);
  return (
    <span className={size === "wide" ? "bp bp-wide" : "bp"}>
      <span className="bp-mark">
        {logo ? (
          <img src={logo} alt="" loading="lazy" decoding="async" />
        ) : (
          <span className="bp-word">{site.shortName || site.organization.name || site.name}</span>
        )}
      </span>
      {label ? <span className="bp-title">{label}</span> : null}
    </span>
  );
}
