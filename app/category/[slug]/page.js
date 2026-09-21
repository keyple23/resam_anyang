import { notFound } from "next/navigation";
import { categories, categoryBySlug } from "@/lib/site";
import { getArticlesByCategory } from "@/lib/articles";
import ArticleCard from "@/components/ArticleCard";
import { JsonLd, breadcrumbSchema } from "@/lib/schema";

export function generateStaticParams() {
  return categories.map((c) => ({ slug: c.slug }));
}

export function generateMetadata({ params }) {
  const cat = categoryBySlug(params.slug);
  if (!cat) return {};
  return {
    title: cat.name,
    description: cat.description,
    alternates: { canonical: `/category/${cat.slug}/` },
  };
}

export default function CategoryPage({ params }) {
  const cat = categoryBySlug(params.slug);
  if (!cat) notFound();
  const list = getArticlesByCategory(cat.slug);

  return (
    <>
      <section className="hero">
        <div className="wrap">
          <div className="crumb">
            <a href="/">홈</a> · {cat.name}
          </div>
          <h1>{cat.name}</h1>
          <p>{cat.description}</p>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          {list.length ? (
            <div className="cards">
              {list.map((a) => (
                <ArticleCard key={a.slug} article={a} />
              ))}
            </div>
          ) : (
            <p style={{ color: "var(--muted)" }}>아직 이 카테고리에 글이 없습니다.</p>
          )}
        </div>
      </section>

      <JsonLd
        data={breadcrumbSchema([
          { name: "홈", path: "/" },
          { name: cat.name, path: `/category/${cat.slug}/` },
        ])}
      />
    </>
  );
}
