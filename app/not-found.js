export default function NotFound() {
  return (
    <section className="hero">
      <div className="wrap">
        <h1>찾는 글이 없습니다</h1>
        <p>주소가 바뀌었거나 삭제된 글입니다.</p>
        <p style={{ marginTop: 16 }}>
          <a href="/" style={{ color: "var(--accent)", fontWeight: 700 }}>홈으로 가기</a>
        </p>
      </div>
    </section>
  );
}
