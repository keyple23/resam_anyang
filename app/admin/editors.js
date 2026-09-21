"use client";
import { useState } from "react";
import {
  Field, Text, Area, Select, Check, ImagePick, Repeater, MultiPick, RepoImage,
  SerpPreview, BrandPreview, ImageBoard,
} from "./parts";
import { splitList, today } from "@/lib/frontmatter";

// ── 키워드 ────────────────────────────────────────────────
export function KeywordForm({ cfg, site, images, articles, file, data, body, onChange, onBody, onFile }) {
  return (
    <div className="adm-form">
      <SerpPreview
        siteName={site.name}
        siteUrl={site.url}
        path={`keywords/${data.slug || ""}`}
        title={data.title || data.keyword}
        description={data.description}
        note="값을 고치면 바로 바뀝니다"
      />

      <div className="adm-two">
        <Field label="파일 이름" hint="영문 소문자와 하이픈만. 나중에 바꾸지 않는 게 좋습니다">
          <Text value={file} onChange={onFile} placeholder="no-nicotine" />
        </Field>
        <Field label="우선순위" hint="숫자가 클수록 홈 제목과 메뉴에서 앞에 옵니다">
          <Text type="number" value={data.priority ?? 50} onChange={(v) => onChange("priority", Number(v) || 0)} />
        </Field>
      </div>

      <div className="adm-two">
        <Field label="노출을 노리는 키워드" hint="네이버 검색창에 치는 말 그대로">
          <Text value={data.keyword} onChange={(v) => onChange("keyword", v)} placeholder="무니코틴 액상" />
        </Field>
        <Field label="주소에 들어갈 이름" hint="한글도 됩니다. 띄어쓰기는 빼세요">
          <Text value={data.slug} onChange={(v) => onChange("slug", v)} placeholder="무니코틴액상" />
        </Field>
      </div>

      <Field label="같은 뜻의 다른 표기" hint="쉼표로 구분. 띄어쓰기 유무가 다른 표기를 꼭 넣으세요">
        <Text
          value={(data.variants || []).join(", ")}
          onChange={(v) => onChange("variants", splitList(v))}
          placeholder="무니코틴액상, 무니코틴 전자담배"
        />
      </Field>

      <Field label="검색 결과 제목" hint="키워드를 맨 앞에 두세요. 30자 안팎">
        <Text value={data.title} onChange={(v) => onChange("title", v)} />
      </Field>

      <Field label="검색 결과 설명" hint="검색 결과에 그대로 나옵니다. 결론을 먼저, 두 문장 정도">
        <Area value={data.description} onChange={(v) => onChange("description", v)} rows={3} />
      </Field>

      <Field label="대표 이미지">
        <ImagePick cfg={cfg} images={images} value={data.cover} onChange={(v) => onChange("cover", v)} />
      </Field>

      <Field label="이미지 설명" hint="검색엔진과 AI는 사진을 못 봅니다. 무엇이 찍혀 있는지 한 문장으로">
        <Text value={data.coverAlt} onChange={(v) => onChange("coverAlt", v)} />
      </Field>

      <Field label="이 키워드와 묶을 글" hint="눌러서 켜고 끕니다">
        <MultiPick
          options={articles.map((a) => ({ value: a.slug, label: a.title || a.slug }))}
          value={data.articles || []}
          onChange={(v) => onChange("articles", v)}
        />
      </Field>

      <Field label="본문" hint="첫 문단에서 이 키워드가 무엇인지 한 문장으로 정의합니다. 소제목은 ## 로 시작">
        <Area value={body} onChange={onBody} rows={16} mono />
      </Field>

      <Field label="자주 묻는 질문" hint="AI 답변에 그대로 인용되는 부분입니다. 2~4개 권장">
        <Repeater
          items={data.faq}
          onChange={(v) => onChange("faq", v)}
          addLabel="질문 추가"
          fields={[
            { key: "q", placeholder: "질문" },
            { key: "a", placeholder: "답 (두세 문장)", area: true },
          ]}
        />
      </Field>

      <Check checked={data.draft} onChange={(v) => onChange("draft", v)} label="작성 중 (사이트에 안 나옴)" />
    </div>
  );
}

// ── 아티클 ────────────────────────────────────────────────
export function ArticleForm({ cfg, site, images, categories, file, data, body, onChange, onBody, onFile }) {
  return (
    <div className="adm-form">
      <SerpPreview
        siteName={site.name}
        siteUrl={site.url}
        path={`articles/${file || ""}`}
        title={data.title}
        description={data.description}
        note="값을 고치면 바로 바뀝니다"
      />

      <div className="adm-two">
        <Field label="파일 이름" hint="주소가 됩니다. 영문 소문자와 하이픈만">
          <Text value={file} onChange={onFile} placeholder="nicotine-strength" />
        </Field>
        <Field label="분류">
          <Select
            value={data.category}
            onChange={(v) => onChange("category", v)}
            options={categories.map((c) => ({ value: c.slug, label: c.name }))}
          />
        </Field>
      </div>

      <Field label="제목" hint="고객이 검색창에 치는 말이 들어간 질문형이 잘 걸립니다">
        <Text value={data.title} onChange={(v) => onChange("title", v)} />
      </Field>

      <Field label="검색 결과 설명" hint="결론을 먼저, 두 문장 정도">
        <Area value={data.description} onChange={(v) => onChange("description", v)} rows={3} />
      </Field>

      <div className="adm-two">
        <Field label="발행일">
          <Text type="date" value={data.published || today()} onChange={(v) => onChange("published", v)} />
        </Field>
        <Field label="수정일" hint="내용을 고칠 때마다 오늘 날짜로 바꾸세요">
          <Text type="date" value={data.updated || today()} onChange={(v) => onChange("updated", v)} />
        </Field>
      </div>

      <Field label="타겟 키워드" hint="쉼표로 구분">
        <Text
          value={(data.keywords || []).join(", ")}
          onChange={(v) => onChange("keywords", splitList(v))}
        />
      </Field>

      <Field label="대표 이미지">
        <ImagePick cfg={cfg} images={images} value={data.cover} onChange={(v) => onChange("cover", v)} />
      </Field>

      <div className="adm-two">
        <Field label="이미지 설명" hint="무엇이 찍혀 있는지 한 문장">
          <Text value={data.coverAlt} onChange={(v) => onChange("coverAlt", v)} />
        </Field>
        <Field label="사진 밑 설명" hint="없으면 비워두세요">
          <Text value={data.coverCaption} onChange={(v) => onChange("coverCaption", v)} />
        </Field>
      </div>

      <Field
        label="본문"
        hint="소제목은 ## 로 시작. 이미지는 ![설명](파일명.jpg) 로 넣습니다. 표는 | 로 그립니다"
      >
        <Area value={body} onChange={onBody} rows={24} mono />
      </Field>

      <Field label="자주 묻는 질문" hint="AI 답변에 그대로 인용되는 부분입니다">
        <Repeater
          items={data.faq}
          onChange={(v) => onChange("faq", v)}
          addLabel="질문 추가"
          fields={[
            { key: "q", placeholder: "질문" },
            { key: "a", placeholder: "답 (두세 문장)", area: true },
          ]}
        />
      </Field>

      <Check checked={data.draft} onChange={(v) => onChange("draft", v)} label="작성 중 (사이트에 안 나옴)" />
    </div>
  );
}

// ── 이미지 ────────────────────────────────────────────────
export function ImageManager({ cfg, images, onUpload, onDelete, busy }) {
  const [drag, setDrag] = useState(false);

  function pick(files) {
    if (files && files.length) onUpload(Array.from(files));
  }

  return (
    <div>
      <div
        className={`adm-drop ${drag ? "on" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          pick(e.dataTransfer.files);
        }}
      >
        <strong>여기로 이미지를 끌어다 놓으세요</strong>
        <span>또는</span>
        <label className="adm-btn">
          파일 고르기
          <input
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => pick(e.target.files)}
          />
        </label>
        <p className="adm-muted">
          jpg, png, webp, svg · 한 장당 3MB 이하 권장 · 파일명은 자동으로 영문으로 정리됩니다
        </p>
      </div>

      {busy ? <p className="adm-muted">올리는 중입니다…</p> : null}

      <div className="adm-grid">
        {images.length === 0 ? (
          <p className="adm-muted">아직 올린 이미지가 없습니다.</p>
        ) : (
          images.map((n) => (
            <div className="adm-tile" key={n}>
              <RepoImage cfg={cfg} name={n} alt={n} />
              <span>{n}</span>
              <div className="adm-tile-actions">
                <button
                  type="button"
                  className="adm-btn adm-btn-ghost adm-btn-sm"
                  onClick={() => navigator.clipboard?.writeText(n)}
                >
                  파일명 복사
                </button>
                <button
                  type="button"
                  className="adm-btn adm-btn-ghost adm-btn-sm adm-danger"
                  onClick={() => onDelete(n)}
                >
                  삭제
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── 브랜드 설정 ────────────────────────────────────────────
export function SettingsForm({ cfg, images, data, onChange }) {
  const set = (k, v) => onChange({ ...data, [k]: v });
  const setIn = (group, k, v) => onChange({ ...data, [group]: { ...(data[group] || {}), [k]: v } });

  return (
    <div className="adm-form">
      <ImageBoard cfg={cfg} data={data} />
      <BrandPreview cfg={cfg} data={data} />
      <SerpPreview
        exact
        siteName={data.name}
        siteUrl={data.url}
        path=""
        title={data.homeTitle}
        description={data.description}
        note="홈 화면이 검색 결과에 나오는 모습"
      />
      <div className="adm-two">
        <Field label="사이트 이름" hint="화면 왼쪽 위에 보이는 이름">
          <Text value={data.name} onChange={(v) => set("name", v)} />
        </Field>
        <Field label="짧은 이름">
          <Text value={data.shortName} onChange={(v) => set("shortName", v)} />
        </Field>
      </div>

      <Field label="한 줄 소개" hint="홈 맨 위에 크게 나옵니다">
        <Text value={data.tagline} onChange={(v) => set("tagline", v)} />
      </Field>

      <Field label="사이트 설명" hint="검색 결과에 그대로 나옵니다. 브랜드명 + 무엇을 다루는 곳인지">
        <Area value={data.description} onChange={(v) => set("description", v)} rows={3} />
      </Field>

      <Field label="사이트 주소" hint="끝에 슬래시 없이. 한글 도메인은 퓨니코드(xn--...)로">
        <Text value={data.url} onChange={(v) => set("url", v)} placeholder="https://news.example.com" />
      </Field>

      <Field
        label="홈 검색 제목"
        hint="네이버 검색 결과에 나올 홈 제목을 직접 정합니다. 비우면 대표 키워드로 자동 생성됩니다"
      >
        <Text
          value={data.homeTitle}
          onChange={(v) => set("homeTitle", v)}
          placeholder="전자담배액상 | 전자담배액상사이트 | 전담액상 - 웰컴드링크"
        />
      </Field>

      <Field
        label="대표 키워드"
        hint="이 사이트가 노리는 키워드. 쉼표로 구분. 화면에는 안 보이고 구조화 데이터에만 들어갑니다"
      >
        <Text
          value={(data.keywords || []).join(", ")}
          onChange={(v) => set("keywords", splitList(v))}
          placeholder="전자담배액상, 전담액상, 무니코틴액상"
        />
      </Field>

      <div className="adm-two">
        <Field label="브랜드 색" hint="이 색 하나로 배지, 버튼, 강조가 전부 정해집니다">
          <Text value={data.brandColor} onChange={(v) => set("brandColor", v)} placeholder="#ec008c" />
        </Field>
        <Field label="로고 이미지" hint="헤더 가운데. 비우면 글자 로고가 나옵니다">
          <ImagePick cfg={cfg} images={images} value={data.logo} onChange={(v) => set("logo", v)} />
        </Field>
      </div>

      <div className="adm-two">
        <Field label="홈 배경 이미지" hint="비우면 글자만 나옵니다">
          <ImagePick cfg={cfg} images={images} value={data.heroImage} onChange={(v) => set("heroImage", v)} />
        </Field>
        <Field label="공유 미리보기 이미지" hint="카카오톡에 뜨는 이미지. 1200×630 권장">
          <ImagePick cfg={cfg} images={images} value={data.ogImage} onChange={(v) => set("ogImage", v)} />
        </Field>
      </div>

      <Field label="기본 커버 이미지" hint="대표 이미지를 안 넣은 글에 공통으로 깔립니다">
        <ImagePick cfg={cfg} images={images} value={data.coverDefault} onChange={(v) => set("coverDefault", v)} />
      </Field>

      <h3 className="adm-sub">운영 주체</h3>
      <div className="adm-two">
        <Field label="브랜드 이름">
          <Text value={data.organization?.name} onChange={(v) => setIn("organization", "name", v)} />
        </Field>
        <Field label="브랜드 사이트 주소" hint="본 쇼핑몰 주소. 헤더 버튼이 여기로 갑니다">
          <Text value={data.organization?.url} onChange={(v) => setIn("organization", "url", v)} />
        </Field>
      </div>
      <Field label="공식 채널 주소" hint="인스타그램, 스마트스토어 등. 쉼표로 구분">
        <Text
          value={(data.organization?.sameAs || []).join(", ")}
          onChange={(v) => setIn("organization", "sameAs", splitList(v))}
        />
      </Field>
      <Field label="기본 작성자 이름" hint="글마다 따로 적지 않으면 전부 이 이름으로 나옵니다">
        <Text value={data.defaultAuthor?.name} onChange={(v) => setIn("defaultAuthor", "name", v)} />
      </Field>

      <h3 className="adm-sub">행사 띠</h3>
      <p className="adm-muted">
        메뉴 바로 아래에 깔리는 가로 이미지입니다. 이미지를 비우면 띠 자체가 안 나옵니다.
        가로로 긴 이미지를 쓰세요. 1600×600 정도면 적당합니다.
      </p>
      <div className="adm-two">
        <Field label="띠 이미지 (PC)" hint="가로로 긴 이미지. 1600×300 정도가 적당합니다">
          <ImagePick
            cfg={cfg}
            images={images}
            value={data.promo?.image}
            onChange={(v) => setIn("promo", "image", v)}
          />
        </Field>
        <Field label="띠 이미지 (모바일)" hint="비우면 PC용을 그대로 씁니다. 세로로 쌓인 이미지가 어울립니다">
          <ImagePick
            cfg={cfg}
            images={images}
            value={data.promo?.imageMobile}
            onChange={(v) => setIn("promo", "imageMobile", v)}
          />
        </Field>
      </div>
      <div className="adm-two">
        <Field label="눌렀을 때 가는 곳" hint="보통 공식몰 주소나 행사 페이지">
          <Text value={data.promo?.href} onChange={(v) => setIn("promo", "href", v)} />
        </Field>
        <Field label="대체 텍스트" hint="이미지가 안 뜰 때 대신 보일 글. 행사 내용을 적습니다">
          <Text
            value={data.promo?.alt}
            onChange={(v) => setIn("promo", "alt", v)}
            placeholder="모든 액상 3+1"
          />
        </Field>
      </div>
      <Check
        checked={data.promo?.show !== false}
        onChange={(v) => setIn("promo", "show", v)}
        label="띠를 화면에 보여줍니다 (행사가 끝나면 이 체크만 해제하세요)"
      />

      <h3 className="adm-sub">본 사이트 버튼 문구</h3>
      <p className="adm-muted">
        상단 버튼, 푸터 띠, 홈 버튼에 들어가는 말입니다. 쇼핑몰이면 "공식몰", 병원이면 "홈페이지"처럼
        업종에 맞게 바꾸세요. 비우면 "공식몰"로 나옵니다.
      </p>
      <div className="adm-two">
        <Field label="버튼 이름" hint="예: 공식몰, 홈페이지, 예약하기">
          <Text value={data.mainLink?.label} onChange={(v) => setIn("mainLink", "label", v)} placeholder="공식몰" />
        </Field>
        <Field label="푸터 띠 설명" hint="푸터 띠의 작은 글씨">
          <Text value={data.mainLink?.note} onChange={(v) => setIn("mainLink", "note", v)} />
        </Field>
      </div>
      <div className="adm-two">
        <Field label="연락처 칸 제목" hint="예: 고객센터, 진료 안내">
          <Text value={data.mainLink?.contactTitle} onChange={(v) => setIn("mainLink", "contactTitle", v)} />
        </Field>
        <Field label="푸터 한 줄 소개" hint="푸터 맨 아래 '이 사이트는 ~이 운영하며,' 뒤에 붙는 말">
          <Text value={data.mainLink?.about} onChange={(v) => setIn("mainLink", "about", v)} />
        </Field>
      </div>

      <h3 className="adm-sub">사업자 정보</h3>
      <p className="adm-muted">
        푸터에 그대로 나오고, 구조화 데이터로도 검색엔진에 전달됩니다. 없는 항목은 비워두면
        화면에도 안 나오고 구조화 데이터에서도 빠집니다.
      </p>
      <div className="adm-two">
        <Field label="상호명">
          <Text value={data.business?.companyName} onChange={(v) => setIn("business", "companyName", v)} />
        </Field>
        <Field label="대표자">
          <Text value={data.business?.ceo} onChange={(v) => setIn("business", "ceo", v)} />
        </Field>
      </div>
      <div className="adm-two">
        <Field label="사업자등록번호">
          <Text value={data.business?.bizNo} onChange={(v) => setIn("business", "bizNo", v)} />
        </Field>
        <Field label="통신판매업신고번호">
          <Text value={data.business?.mailOrderNo} onChange={(v) => setIn("business", "mailOrderNo", v)} />
        </Field>
      </div>
      <div className="adm-two">
        <Field label="전화번호">
          <Text value={data.business?.phone} onChange={(v) => setIn("business", "phone", v)} />
        </Field>
        <Field label="두 번째 전화번호" hint="휴대폰 상담 번호처럼 하나 더 있으면. 푸터에만 나옵니다">
          <Text value={data.business?.phone2} onChange={(v) => setIn("business", "phone2", v)} />
        </Field>
      </div>
      <div className="adm-two">
        <Field label="이메일">
          <Text value={data.business?.email} onChange={(v) => setIn("business", "email", v)} />
        </Field>
      </div>
      <div className="adm-two">
        <Field label="이용약관 주소">
          <Text value={data.business?.terms} onChange={(v) => setIn("business", "terms", v)} />
        </Field>
        <Field label="개인정보처리방침 주소">
          <Text value={data.business?.privacy} onChange={(v) => setIn("business", "privacy", v)} />
        </Field>
      </div>
      <Field label="운영시간 안내" hint="푸터에 글자 그대로 나옵니다. 예: 평일 10:00~18:00">
        <Text value={data.business?.hours} onChange={(v) => setIn("business", "hours", v)} />
      </Field>

      <h3 className="adm-sub">매장 위치 (구조화 데이터)</h3>
      <p className="adm-muted">
        오프라인 매장이나 사업장이 있으면 채워주세요. 주소와 전화번호가 둘 다 비어 있으면 이
        항목은 아예 만들어지지 않습니다.
      </p>
      <Field label="업종">
        <Select
          value={data.business?.type || "LocalBusiness"}
          onChange={(v) => setIn("business", "type", v)}
          options={[
            { value: "LocalBusiness", label: "일반 사업장" },
            { value: "Store", label: "매장 / 소매점" },
            { value: "ClothingStore", label: "의류 매장" },
            { value: "HealthAndBeautyBusiness", label: "미용 / 건강" },
            { value: "FoodEstablishment", label: "음식점 / 카페" },
            { value: "ProfessionalService", label: "전문 서비스" },
          ]}
        />
      </Field>
      <Field label="사업장 주소" hint="푸터에 나오는 전체 주소">
        <Text value={data.business?.address} onChange={(v) => setIn("business", "address", v)} />
      </Field>
      <div className="adm-two">
        <Field label="시도" hint="예: 경기도">
          <Text value={data.business?.addressRegion} onChange={(v) => setIn("business", "addressRegion", v)} />
        </Field>
        <Field label="시군구" hint="예: 시흥시">
          <Text value={data.business?.addressLocality} onChange={(v) => setIn("business", "addressLocality", v)} />
        </Field>
      </div>
      <div className="adm-two">
        <Field label="나머지 주소" hint="비우면 위 사업장 주소를 그대로 씁니다">
          <Text value={data.business?.streetAddress} onChange={(v) => setIn("business", "streetAddress", v)} />
        </Field>
        <Field label="우편번호">
          <Text value={data.business?.postalCode} onChange={(v) => setIn("business", "postalCode", v)} />
        </Field>
      </div>
      <div className="adm-two">
        <Field label="영업시간" hint="이 형식만 인정됩니다. 요일마다 다르면 ; 로 이어 적기. 예: Mo-Fr 11:00-21:00; Sa 10:00-15:00">
          <Text
            value={data.business?.openingHours}
            onChange={(v) => setIn("business", "openingHours", v)}
            placeholder="Mo-Sa 10:00-22:00"
          />
        </Field>
        <Field label="가격대" hint="예: ₩₩">
          <Text value={data.business?.priceRange} onChange={(v) => setIn("business", "priceRange", v)} />
        </Field>
      </div>

      <h3 className="adm-sub">분류</h3>
      <p className="adm-muted">
        글을 묶는 분류입니다. 3~5개가 적당합니다. 주소에 쓰이는 이름은 영문 소문자로 적으세요.
      </p>
      <Repeater
        items={data.categories}
        onChange={(v) => set("categories", v)}
        addLabel="분류 추가"
        fields={[
          { key: "slug", placeholder: "영문 이름 (guide)" },
          { key: "name", placeholder: "화면에 보이는 이름 (입문 가이드)" },
          { key: "description", placeholder: "한 줄 설명", area: true },
        ]}
      />
    </div>
  );
}

// ── 홈 글 ─────────────────────────────────────────────
export function HomeForm({ cfg, site, data, body, onChange, onBody }) {
  const set = (k, v) => onChange({ ...data, [k]: v });

  return (
    <div className="adm-form">
      <SerpPreview
        exact
        siteName={site?.name}
        siteUrl={site?.url}
        path=""
        title={site?.homeTitle || data.title}
        description={data.description}
        note={
          site?.homeTitle
            ? "브랜드 설정의 '홈 검색 제목'이 쓰입니다"
            : "홈 검색 제목이 비어 있어 아래 제목이 그대로 쓰입니다"
        }
      />

      <Field label="제목" hint="화면 맨 위에 크게 나옵니다. 노리는 키워드를 앞쪽에 넣으세요">
        <Text value={data.title} onChange={(v) => set("title", v)} />
      </Field>

      <Field label="설명" hint="제목 아래 검색 결과에 나옵니다. 두 문장 정도">
        <Area value={data.description} onChange={(v) => set("description", v)} rows={3} />
      </Field>

      <div className="adm-two">
        <Field label="아이콘" hint="제목 위에 놓이는 그림문자 하나. 비워도 됩니다">
          <Text value={data.emoji} onChange={(v) => set("emoji", v)} placeholder="👕" />
        </Field>
        <Field label="작성자" hint="비우면 브랜드 설정의 기본 작성자를 씁니다">
          <Text
            value={data.author?.name}
            onChange={(v) => onChange({ ...data, author: { ...(data.author || {}), name: v } })}
          />
        </Field>
      </div>

      <div className="adm-two">
        <Field label="작성일">
          <Text value={data.published} onChange={(v) => set("published", v)} placeholder={today()} />
        </Field>
        <Field label="수정일" hint="내용을 고칠 때마다 날짜를 올려주세요">
          <Text value={data.updated} onChange={(v) => set("updated", v)} placeholder={today()} />
        </Field>
      </div>

      <Field label="태그" hint="쉼표로 구분. 제목 아래와 글 맨 끝에 나옵니다">
        <Text value={(data.tags || []).join(", ")} onChange={(v) => set("tags", splitList(v))} />
      </Field>

      <Field label="안내 문구" hint="본문 위 회색 상자. 비우면 안 나옵니다">
        <Text value={data.notice} onChange={(v) => set("notice", v)} />
      </Field>

      <div className="adm-two">
        <Field label="공식몰 버튼 문구" hint="큰 제목이 나올 때마다 이 버튼이 자동으로 들어갑니다">
          <Text value={data.ctaLabel} onChange={(v) => set("ctaLabel", v)} />
        </Field>
        <Field label="공식몰 주소" hint="비우면 브랜드 설정의 공식몰 주소를 씁니다">
          <Text value={data.ctaUrl} onChange={(v) => set("ctaUrl", v)} />
        </Field>
      </div>

      <Field
        label="공식몰 버튼 개수"
        hint="글 하나에 몇 개 넣을지. 맨 끝 하나를 포함한 수입니다. 나머지는 본문에 고르게 흩어집니다"
      >
        <Select
          value={String(data.ctaCount ?? 2)}
          onChange={(v) => set("ctaCount", Number(v))}
          options={[
            { value: "2", label: "2개 (권장)" },
            { value: "1", label: "1개 (맨 끝에만)" },
            { value: "3", label: "3개" },
            { value: "4", label: "4개" },
            { value: "0", label: "넣지 않음" },
          ]}
        />
      </Field>

      <Field
        label="본문"
        hint="## 로 시작하면 큰 제목입니다. 큰 제목마다 공식몰 버튼이 자동으로 붙습니다"
      >
        <Area value={body} onChange={onBody} rows={26} mono />
      </Field>
    </div>
  );
}
