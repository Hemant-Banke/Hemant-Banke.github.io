import { useMemo } from "react";
import { useParams } from "react-router-dom";
import ArtifactLinks from "../components/ArtifactLinks";
import GraphDock from "../components/GraphDock";
import NoteBody from "../components/NoteBody";
import { getNote, noteSubgraph } from "../content/manifest";
import NotFound from "./NotFound";

export default function Note() {
  const params = useParams();
  const slug = params["*"] ?? "";
  const note = getNote(slug);

  // The note's subset graph, laid out at build time (see graph-layout.mjs).
  const sub = useMemo(() => (note ? noteSubgraph(slug) : null), [slug, note]);

  if (!note) return <NotFound />;

  return (
    <div className="page layout note-page">
      <article className="note">
        <header className="note-head">
          <div className="note-head-text">
            <h1 className="note-title">
              {note.star && (
                <span className="star-badge" title="featured" aria-label="featured">
                  ★{" "}
                </span>
              )}
              {note.title}
            </h1>
            {(note.byline || note.status) && (
              <p className="note-byline dim">
                {note.byline}
                {note.status && (
                  <span className={"badge note-status " + note.status}>{note.status}</span>
                )}
              </p>
            )}
            <div className="note-meta dim">
              {note.date && <span>{note.date}</span>}
              <span> · {note.wordCount} words</span>
            </div>
            <ArtifactLinks artifacts={note.artifacts} className="note-artifacts" />
          </div>

          {sub && sub.nodes.length > 1 && (
            <GraphDock
              nodes={sub.nodes}
              edges={sub.edges}
              positions={sub.positions}
              focusId={slug}
            />
          )}
        </header>

        <NoteBody html={note.html} />

        {note.tags.length > 0 && (
          <footer className="note-foot">
            <span className="note-foot-label dim">tags</span>
            {note.tags.map((t) => (
              <span className="tag" key={t}>
                #{t}
              </span>
            ))}
          </footer>
        )}
      </article>
    </div>
  );
}
