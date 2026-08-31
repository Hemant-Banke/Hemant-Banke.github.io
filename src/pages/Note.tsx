import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import AsciiGraph from "../components/AsciiGraph";
import ArtifactLinks from "../components/ArtifactLinks";
import NoteBody from "../components/NoteBody";
import PdfRoute from "../components/PdfRoute";
import {
  getGroup,
  getNote,
  isPdfOnly,
  noteSubgraph,
  pdfArtifact,
} from "../content/manifest";
import NotFound from "./NotFound";

export default function Note() {
  const params = useParams();
  const slug = params["*"] ?? "";
  const note = getNote(slug);

  // The note's subset graph, laid out at build time (see graph-layout.mjs).
  const sub = useMemo(() => (note ? noteSubgraph(slug) : null), [slug, note]);

  if (!note) return <NotFound />;

  // A page that's just a PDF pointer (no body text) opens the PDF directly.
  if (isPdfOnly(note)) {
    return (
      <PdfRoute
        url={pdfArtifact(note)!}
        downloadName={`${note.slug.split("/").pop()}.pdf`}
      />
    );
  }

  const group = getGroup(note.groupSlug);

  const backlinks = note.backlinks.map(getNote).filter(Boolean);
  const outgoing = note.links.map(getNote).filter(Boolean);

  return (
    <div className="page layout note-page">
      <div className="note-breadcrumb dim">
        <Link to="/digital-garden">~/digital-garden</Link>
        <span> / </span>
        <span style={{ color: group?.color }}>{note.group}</span>
        <span> / </span>
        <span className="accent-cyan">{note.title}</span>
      </div>

      <article className="note">
        <header className="note-head">
          <h1 className="note-title">
            {note.star && (
              <span className="star-badge" title="featured" aria-label="featured">
                ★{" "}
              </span>
            )}
            {note.title}
            {note.status && (
              <span className={"badge note-status " + note.status}>{note.status}</span>
            )}
          </h1>
          {note.byline && <p className="note-byline dim">{note.byline}</p>}
          <div className="note-meta dim">
            {note.date && <span>{note.date}</span>}
            <span> · {note.wordCount} words</span>
            {note.tags.map((t) => (
              <span className="tag" key={t}>
                #{t}
              </span>
            ))}
          </div>
          <ArtifactLinks artifacts={note.artifacts} className="note-artifacts" />
        </header>

        <NoteBody html={note.html} />
      </article>

      <aside className="note-aside">
        <div className="box note-links-box">
          <span className="box-title">links</span>
          <div className="note-links-cols">
            <div>
              <h3 className="note-links-h accent-green">← backlinks</h3>
              {backlinks.length ? (
                <ul className="mono-list">
                  {backlinks.map(
                    (b) =>
                      b && (
                        <li key={b.slug}>
                          <Link to={`/digital-garden/${b.slug}`}>● {b.title}</Link>
                        </li>
                      ),
                  )}
                </ul>
              ) : (
                <p className="dim">no notes link here yet.</p>
              )}
            </div>
            <div>
              <h3 className="note-links-h accent-cyan">→ links out</h3>
              {outgoing.length ? (
                <ul className="mono-list">
                  {outgoing.map(
                    (b) =>
                      b && (
                        <li key={b.slug}>
                          <Link to={`/digital-garden/${b.slug}`}>● {b.title}</Link>
                        </li>
                      ),
                  )}
                </ul>
              ) : (
                <p className="dim">this note links nowhere yet.</p>
              )}
            </div>
          </div>
        </div>

        {sub && sub.nodes.length > 1 && (
          <div className="box note-graph-box">
            <span className="box-title">local graph</span>
            <AsciiGraph
              nodes={sub.nodes}
              edges={sub.edges}
              positions={sub.positions}
              height={300}
              focusId={slug}
              mini
            />
          </div>
        )}
      </aside>
    </div>
  );
}
