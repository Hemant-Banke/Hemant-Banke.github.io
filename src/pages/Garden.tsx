import { type CSSProperties, useCallback, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import AsciiGraph from "../components/AsciiGraph";
import FileTree from "../components/FileTree";
import { fullGraphPositions, getGroup, manifest, recentNotes } from "../content/manifest";
import { useDismiss, useDocumentTitle, useIsNarrow } from "../lib/hooks";

type View = "graph" | "explorer";

export default function Garden() {
  useDocumentTitle("Garden");
  const narrow = useIsNarrow();
  const [view, setView] = useState<View>(narrow ? "explorer" : "graph");
  // Active topic filter for the explorer note list (null = all topics).
  const [topic, setTopic] = useState<string | null>(null);
  const [topicsOpen, setTopicsOpen] = useState(false);
  const topicRef = useRef<HTMLDivElement>(null);
  useDismiss(topicsOpen, topicRef, useCallback(() => setTopicsOpen(false), []));
  const activeGroup = topic ? getGroup(topic) : undefined;
  const pickTopic = (slug: string | null) => {
    setTopic(slug);
    setTopicsOpen(false);
  };
  const notes = recentNotes();
  const shownNotes = useMemo(
    () => (topic ? notes.filter((n) => n.groupSlug === topic) : notes),
    [notes, topic],
  );
  const linkEdges = manifest.graph.edges.filter((e) => e.kind === "link").length;

  return (
    <div className="page layout garden-index">
      <div className="section-head">
        <h1>
          <span className="path">digital-garden</span> · knowledge graph
        </h1>
      </div>
      <p className="lead">
        A public notebook. Folders are groups; links are edges. Wander the graph
        or browse the tree.
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
          <span className="box-title">graph — force-directed</span>
          <AsciiGraph
            nodes={manifest.graph.nodes}
            edges={manifest.graph.edges}
            positions={fullGraphPositions()}
            height={narrow ? 420 : 580}
            initialZoom={0.36}
          />
        </div>
      ) : (
        <div className="explorer-grid">
          <FileTree tree={manifest.tree} />
          <div className="box note-list-box">
            <span className="box-title">
              {topic
                ? `${manifest.groups.find((g) => g.slug === topic)?.name}/ — newest first`
                : "all notes — newest first"}
            </span>

            {/* Topic filter: one button; the topics live in a popover dialog. */}
            <div className="topic-filter" ref={topicRef}>
              <button
                className="topic-chip"
                aria-haspopup="dialog"
                aria-expanded={topicsOpen}
                onClick={() => setTopicsOpen((o) => !o)}
                style={{ "--chip": activeGroup?.color } as CSSProperties}
              >
                <span className="topic-dot" aria-hidden="true">
                  ●
                </span>
                {activeGroup ? activeGroup.name : "all topics"}{" "}
                <span className="dim">
                  ({activeGroup ? activeGroup.noteSlugs.length : notes.length})
                </span>
                <span className="dim"> {topicsOpen ? "▴" : "▾"}</span>
              </button>

              {topicsOpen && (
                <div className="tag-dialog box" role="dialog" aria-label="filter by topic">
                  <div className="tag-dialog-bar">
                    <span className="accent-cyan">filter by topic</span>
                    <span className="tag-dialog-hint" />
                    <button
                      className="tag-dialog-act"
                      aria-label="close"
                      onClick={() => setTopicsOpen(false)}
                    >
                      [x]
                    </button>
                  </div>
                  <div className="tag-dialog-list">
                    <button
                      className="topic-chip"
                      aria-pressed={topic === null}
                      onClick={() => pickTopic(null)}
                    >
                      all <span className="dim">({notes.length})</span>
                    </button>
                    {manifest.groups.map((g) => (
                      <button
                        key={g.slug}
                        className="topic-chip"
                        aria-pressed={topic === g.slug}
                        onClick={() => pickTopic(g.slug)}
                        style={{ "--chip": g.color } as CSSProperties}
                      >
                        <span className="topic-dot" aria-hidden="true">
                          ●
                        </span>
                        {g.name} <span className="dim">({g.noteSlugs.length})</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <ul className="mono-list note-list">
              {shownNotes.map((n) => (
                <li key={n.slug} className="note-list-item">
                  <Link to={`/digital-garden/${n.slug}`} className="note-list-link">
                    {/* the dot carries the note's folder colour */}
                    <span
                      className="note-list-dot"
                      style={{ color: getGroup(n.groupSlug)?.color }}
                      aria-hidden="true"
                    >
                      ●
                    </span>
                    {n.star && (
                      <span className="star-badge" aria-label="featured">
                        ★{" "}
                      </span>
                    )}
                    <span className="note-list-title">{n.title}</span>
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
