import "./globals.css";
import { site, palette } from "@/lib/site";
import { keywordLine, allKeywordTerms } from "@/lib/keywords";
import { absoluteImage } from "@/lib/images";
import SiteChrome from "@/components/SiteChrome";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export const metadata = {
  metadataBase: new URL(site.url),
  // 웹문서탭 상위 사이트들이 쓰는 패턴이다.
  // 키워드를 앞에 나열하고 브랜드명을 뒤에 붙인다.
  title: {
    default: site.homeTitle || `${keywordLine(3)} - ${site.name}`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  keywords: allKeywordTerms(),
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: site.name,
    locale: site.locale,
    url: site.url,
    title: site.homeTitle || `${keywordLine(3)} - ${site.name}`,
    description: site.description,
    ...(site.ogImage
      ? {
          images: [
            { url: absoluteImage(site.ogImage), width: 1200, height: 630, alt: site.name },
          ],
        }
      : {}),
  },
  ...(site.ogImage
    ? { twitter: { card: "summary_large_image", images: [absoluteImage(site.ogImage)] } }
    : {}),
  robots: {
    index: true,
    follow: true,
    "max-snippet": -1,
    "max-image-preview": "large",
  },
  verification: {
    ...(site.verification.google ? { google: site.verification.google } : {}),
    ...(site.verification.naver
      ? { other: { "naver-site-verification": site.verification.naver } }
      : {}),
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang={site.lang}>
      <head>
        {/* 브랜드 색 하나로 화면 전체 색이 정해진다 */}
        <style
          dangerouslySetInnerHTML={{
            __html: `:root{--accent:${palette.accent};--accent-dark:${palette.accentDark};--accent-soft:${palette.accentSoft};--accent-line:${palette.accentLine};}`,
          }}
        />
      </head>
      <body>
        <SiteChrome header={<SiteHeader />} footer={<SiteFooter />}>
          {children}
        </SiteChrome>
      </body>
    </html>
  );
}
