import { Link } from "react-router-dom";
import ArtifactLinks from "./ArtifactLinks";
import { groupLabel } from "../content/manifest";
import type { NoteMeta } from "../content/types";

/**
 * A garden page as a full-width academic line item — title and date on the
 * first line, attribution under it, then its links, the summary, and tags.
 * Used by every listing (research, projects, home).
 */
export default function NoteItem({
  note,
  showGroup = false,
  showTags = true,
}: {
  note: NoteMeta;
  showGroup?: boolean;
  showTags?: boolean;
}) {
  const tags = showTags ? note.tags : [];
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

      <ArtifactLinks artifacts={note.artifacts} className="item-links" />

      {note.summary && <p className="item-summary">{note.summary}</p>}

      {tags.length > 0 && (
        <div className="item-tags">
          {tags.map((t) => (
            <span className="tag" key={t}>
              #{t}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}
