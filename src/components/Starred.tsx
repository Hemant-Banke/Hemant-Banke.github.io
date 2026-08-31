import { Link } from "react-router-dom";
import NoteItem from "./NoteItem";
import { starredNotes } from "../content/manifest";

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
      <div className="item-list">
        {items.map((n) => (
          <NoteItem note={n} showGroup key={n.slug} />
        ))}
      </div>
    </section>
  );
}
