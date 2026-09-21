import { site } from "@/lib/site";
import { JsonLd, breadcrumbSchema, localBusinessSchema } from "@/lib/schema";

export const metadata = {
  title: "소개",
  description: `${site.organization.name}이 ${site.name}을 운영하는 이유와, 글을 쓰는 기준을 정리했습니다.`,
  alternates: { canonical: "/about/" },
};

export default function AboutPage() {
  return (
    <article className="article">
      <div className="wrap">
        <header className="article-head">
          <div className="crumb">
            <a href="/">홈</a> · 소개
          </div>
          <h1>{site.name} 소개</h1>
          <p className="lead">{site.description}</p>
        </header>

        <div className="prose">
          <h2>누가 만드나요</h2>
          <p>
            {site.name}은 {site.organization.name}이 직접 운영합니다. {site.mainLink.about}{" "}
            예약, 가격, 구매 같은 안내는{" "}
            <a href={site.organization.url}>{site.organization.name} {site.mainLink.label}</a>에 따로 있습니다.
          </p>

          <h2>어떤 기준으로 쓰나요</h2>
          <ul>
            <li>실제로 받은 문의에서 반복되는 질문을 주제로 잡습니다.</li>
            <li>결론을 먼저 쓰고 근거를 뒤에 붙입니다.</li>
            <li>숫자는 확인된 것만 적고, 확인이 안 되는 것은 적지 않습니다.</li>
            <li>내용이 바뀌면 글을 새로 쓰지 않고 기존 글을 고치고 수정일을 남깁니다.</li>
          </ul>

          <h2>문의</h2>
          <p>
            내용에 사실과 다른 부분이 있으면 알려주세요. 확인 후 본문을 고치고 수정일을
            남깁니다.
          </p>
        </div>
      </div>

      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "홈", path: "/" },
            { name: "소개", path: "/about/" },
          ]),
          localBusinessSchema(),
        ]}
      />
    </article>
  );
}
