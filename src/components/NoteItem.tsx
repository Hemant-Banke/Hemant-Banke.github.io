import { Link } from "react-router-dom";
import ArtifactLinks from "./ArtifactLinks";
import { groupLabel } from "../content/manifest";
import type { NoteMeta } from "../content/types";

/**
 * A garden page as a full-width academic line item — title and date on the
 * first line, attribution under it, then the summary, then tags and links.
 * Used by every listing (research, projects, curated, home).
 */
export default function NoteItem({
  note,
  showGroup = false,
}: {
  note: NoteMeta;
  showGroup?: boolean;
}) {
  const group = showGroup ? groupLabel(note) : "";

  return (
    <article className="item">
      <div className="item-head">
        <Link
          to={`/digital-garden/${note.slug}`}
          className={"item-title" + (note.star ? " item-title-star" : "")}
          title={note.star ? "featured" : undefined}
        >
          {note.title}
        </Link>
        {note.date && <span className="item-date dim">{note.date}</span>}
      </div>

      {(note.byline || group || note.status) && (
        <p className="item-byline dim">
          {note.byline}
          {note.byline && group && " · "}
          {group}
          {note.status && (
            <span className={"badge item-status " + note.status}>{note.status}</span>
          )}
        </p>
      )}

      {note.summary && <p className="item-summary">{note.summary}</p>}

      {(note.tags.length > 0 || note.artifacts.length > 0) && (
        <div className="item-foot">
          {note.tags.length > 0 && (
            <div className="item-tags">
              {note.tags.map((t) => (
                <span className="tag" key={t}>
                  #{t}
                </span>
              ))}
            </div>
          )}
          <ArtifactLinks artifacts={note.artifacts} className="item-links" />
        </div>
      )}
    </article>
  );
}
