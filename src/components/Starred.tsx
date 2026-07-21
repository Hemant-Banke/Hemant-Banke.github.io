import { Link } from "react-router-dom";
import ArtifactLinks from "./ArtifactLinks";
import { groupLabel, starredNotes } from "../content/manifest";

/**
 * Curated section of starred/featured pages, so visitors can reach the good
 * stuff fast. Any garden page with `star: true` in frontmatter shows up here.
 */
export default function Starred({ max }: { max?: number }) {
  const all = starredNotes();
  const items = max ? all.slice(0, max) : all;
  if (!items.length) return null;

  return (
    <section className="starred" aria-label="starred pages">
      <div className="section-head">
        <span className="hash star-badge">★</span>
        <h2>
          <span className="path">curated</span> · starred
        </h2>
        <Link to="/curated" className="starred-count dim">
          all {all.length} →
        </Link>
      </div>
      <div className="starred-grid">
        {items.map((n) => (
          <article className="starred-card" key={n.slug}>
            <div className="starred-head">
              <Link to={`/digital-garden/${n.slug}`} className="starred-title">
                {n.title}
              </Link>
              <span className="starred-group dim">{groupLabel(n)}</span>
            </div>
            {n.summary && <p className="starred-summary dim">{n.summary}</p>}
            <ArtifactLinks artifacts={n.artifacts} className="starred-links" />
          </article>
        ))}
      </div>
    </section>
  );
}
