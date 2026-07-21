import { Link } from "react-router-dom";
import ArtifactLinks from "./ArtifactLinks";
import type { NoteMeta } from "../content/types";

/** Card for a garden page in a listing (projects, research, …). */
export default function NoteCard({ note }: { note: NoteMeta }) {
  return (
    <article className="card">
      <div className="card-top">
        <Link to={`/digital-garden/${note.slug}`} className="card-name">
          {note.title}
        </Link>
        <span className="card-badges">
          {note.star && <span className="badge star-badge">★</span>}
          {note.status && <span className={"badge " + note.status}>{note.status}</span>}
        </span>
      </div>
      {note.byline && <p className="card-byline dim">{note.byline}</p>}
      {note.summary && <p className="card-blurb">{note.summary}</p>}
      {(note.tags.length > 0 || note.date) && (
        <div className="card-meta">
          {note.tags.map((t) => (
            <span className="tag" key={t}>
              {t}
            </span>
          ))}
          {note.date && <span className="tag">{note.date.slice(0, 4)}</span>}
        </div>
      )}
      <ArtifactLinks artifacts={note.artifacts} className="card-links" />
    </article>
  );
}
