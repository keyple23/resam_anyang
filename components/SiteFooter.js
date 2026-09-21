import { site, categories } from "@/lib/site";
import { getKeywords } from "@/lib/keywords";
import { JsonLd, organizationSchema, webSiteSchema } from "@/lib/schema";

// 값이 있는 것만 한 줄로 이어 붙인다. 빈 항목은 아예 안 나온다.
function Line({ items }) {
  const list = items.filter((x) => x && x[1]);
  if (!list.length) return null;
  return (
    <p className="biz-line">
      {list.map(([label, value], i) => (
        <span key={i}>
          <em>{label}</em> {value}
        </span>
      ))}
    </p>
  );
}

export default function SiteFooter() {
  const keywords = getKeywords();
  const b = site.business || {};

  return (
    <>
      <footer className="site-footer">
        <div className="wrap">
          {/* 공식몰로 보내는 띠 */}
          <a className="foot-cta" href={site.organization.url}>
            <span className="foot-cta-text">
              <strong>{site.organization.name} {site.mainLink.label}</strong>
              <small>{site.mainLink.note}</small>
            </span>
            <span className="foot-cta-btn">바로가기</span>
          </a>

          <div className="cols">
            <div>
              <h4>{site.name}</h4>
              <p style={{ margin: 0, maxWidth: "42ch" }}>{site.description}</p>
            </div>

            <div>
              <h4>주제별로 보기</h4>
              <ul>
                {keywords.map((k) => (
                  <li key={k.slug}>
                    <a href={`/keywords/${k.slug}/`}>{k.keyword}</a>
                  </li>
                ))}
                {categories.map((c) => (
                  <li key={c.slug}>
                    <a href={`/category/${c.slug}/`}>{c.name}</a>
                  </li>
                ))}
                <li>
                  <a href="/about/">소개</a>
                </li>
              </ul>
            </div>

            <div>
              <h4>{site.mainLink.contactTitle}</h4>
              <ul>
                {b.phone ? <li className="foot-phone">{b.phone}</li> : null}
                {b.phone2 ? <li className="foot-phone">{b.phone2}</li> : null}
                {b.hours ? <li>{b.hours}</li> : null}
                {b.email ? <li><a href={`mailto:${b.email}`}>{b.email}</a></li> : null}
                {b.terms ? <li><a href={b.terms}>이용약관</a></li> : null}
                {b.privacy ? <li><a href={b.privacy}>개인정보처리방침</a></li> : null}
              </ul>
            </div>
          </div>

          <div className="notice">
            <Line
              items={[
                ["상호명", b.companyName],
                ["대표자", b.ceo],
              ]}
            />
            <Line items={[["사업장 주소", b.address]]} />
            <Line
              items={[
                ["사업자등록번호", b.bizNo],
                ["통신판매업신고", b.mailOrderNo],
              ]}
            />
            <p style={{ margin: "10px 0 0" }}>
              이 사이트는 {site.organization.name}이 운영하며, {site.mainLink.about}
            </p>
            <p style={{ margin: "4px 0 0" }}>
              © {new Date().getFullYear()} {site.organization.name}
            </p>
          </div>
        </div>
      </footer>

      <JsonLd data={[organizationSchema(), webSiteSchema()]} />
    </>
  );
}
