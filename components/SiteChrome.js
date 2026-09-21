"use client";
import { usePathname } from "next/navigation";

/**
 * 공개 화면에만 머리말·꼬리말을 붙인다.
 * 관리자 화면(/admin)에서는 화면 전체를 관리자 UI가 쓴다.
 */
export default function SiteChrome({ header, footer, children }) {
  const pathname = usePathname() || "/";
  if (pathname.startsWith("/admin")) return <>{children}</>;

  return (
    <>
      {header}
      <main>{children}</main>
      {footer}
    </>
  );
}
