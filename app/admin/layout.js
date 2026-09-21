export const metadata = {
  title: "관리자",
  // 검색엔진이 절대 수집하지 않도록 막는다
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }) {
  return children;
}
