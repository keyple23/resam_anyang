import { site } from "@/lib/site";
import { normalizeImage } from "@/lib/images";
import BrandPanel from "@/components/BrandPanel";

/**
 * 글 맨 위에 들어가는 대표 이미지.
 * 지정한 이미지도 공통 기본 사진도 없으면 브랜드 판을 대신 깐다.
 */
export default function Cover({ src, alt = "", caption = "", title = "" }) {
  const url = normalizeImage(src) || normalizeImage(site.coverDefault);

  if (url) {
    return (
      <figure className="cover">
        <img src={url} alt={alt} />
        {caption ? <figcaption>{caption}</figcaption> : null}
      </figure>
    );
  }

  return (
    <figure className="cover cover-brand">
      <BrandPanel label={title} size="wide" />
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  );
}
