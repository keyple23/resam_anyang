import { categoryBySlug } from "@/lib/site";
import Thumb from "./Thumb";

export default function ArticleCard({ article, size }) {
  const cat = categoryBySlug(article.category);
  return (
    <a
      className={size === "wide" ? "card card-feature" : "card"}
      href={`/articles/${article.slug}/`}
    >
      <Thumb
        src={article.cover}
        alt={article.coverAlt}
        seed={article.slug}
        label={article.title}
        size={size === "wide" ? "wide" : "card"}
      />
      <span className="card-body">
        {cat ? <span className="cat">{cat.name}</span> : null}
        <h3>{article.title}</h3>
        <p>{article.description}</p>
        <span className="meta">{article.published}</span>
      </span>
    </a>
  );
}
