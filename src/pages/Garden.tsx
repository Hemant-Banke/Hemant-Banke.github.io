import { useState } from "react";
import { Link } from "react-router-dom";
import AsciiGraph from "../components/AsciiGraph";
import FileTree from "../components/FileTree";
import { manifest, recentNotes } from "../content/manifest";
import { useIsNarrow } from "../lib/hooks";

type View = "graph" | "explorer";

export default function Garden() {
  const narrow = useIsNarrow();
  const [view, setView] = useState<View>(narrow ? "explorer" : "graph");
  const notes = recentNotes();
  const linkEdges = manifest.graph.edges.filter((e) => e.kind === "link").length;

  return (
    <div className="page layout garden-index">
      <div className="section-head">
        <span className="hash">##</span>
        <h1>
          <span className="path">~/digital-garden</span> · knowledge graph
        </h1>
      </div>
      <p className="lead">
        A public notebook. Folders are groups; <span className="accent-green">[[links]]</span>{" "}
        are edges. Wander the graph or browse the tree.
      </p>

      <div className="garden-toolbar">
        <div className="view-toggle" role="group" aria-label="view mode">
          <button
            className="btn"
            aria-pressed={view === "graph"}
            onClick={() => setView("graph")}
          >
            ◈ graph
          </button>
          <button
            className="btn"
            aria-pressed={view === "explorer"}
            onClick={() => setView("explorer")}
          >
            ▸ explorer
          </button>
        </div>
        <div className="garden-stats dim">
          {manifest.notes.length} notes · {manifest.groups.length} groups ·{" "}
          {linkEdges} links
        </div>
      </div>

      <ul className="graph-legend" aria-label="groups">
        {manifest.groups.map((g) => (
          <li key={g.slug} className="legend-item">
            <span style={{ color: g.color }} aria-hidden="true">
              ●
            </span>{" "}
            {g.name}
            <span className="dim"> ({g.noteSlugs.length})</span>
          </li>
        ))}
      </ul>

      {view === "graph" ? (
        <div className="box graph-box">
          <span className="box-title">graph — force-directed · ascii</span>
          <AsciiGraph
            nodes={manifest.graph.nodes}
            edges={manifest.graph.edges}
            height={narrow ? 420 : 580}
          />
        </div>
      ) : (
        <div className="explorer-grid">
          <FileTree tree={manifest.tree} />
          <div className="box note-list-box">
            <span className="box-title">all notes — newest first</span>
            <ul className="mono-list note-list">
              {notes.map((n) => (
                <li key={n.slug} className="note-list-item">
                  <Link to={`/digital-garden/${n.slug}`} className="note-list-link">
                    {n.star && (
                      <span className="star-badge" aria-label="featured">
                        ★{" "}
                      </span>
                    )}
                    <span className="note-list-title">{n.title}</span>
                    <span className="dim"> — {n.group}/</span>
                  </Link>
                  {n.summary && <p className="dim note-list-summary">{n.summary}</p>}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
