import { useState } from "react";
import { Link } from "react-router-dom";
import NoteItem from "./NoteItem";
import { notesInGroup } from "../content/manifest";

/** Research and projects as tabs on the home page; "all N →" opens the full listing. */

const TABS = [
  {
    key: "research",
    group: "research",
    label: "research",
    href: "/research",
  },
  {
    key: "projects",
    group: "projects",
    label: "projects",
    href: "/projects",
  },
] as const;

type TabKey = (typeof TABS)[number]["key"];

// How many cards to show before deferring to the full listing.
const PREVIEW = 4;

export default function WorkTabs() {
  const [active, setActive] = useState<TabKey>("research");
  const tab = TABS.find((t) => t.key === active) ?? TABS[0];
  const notes = notesInGroup(tab.group);
  const shown = notes.slice(0, PREVIEW);

  return (
    <section className="work-tabs" aria-label="research and projects">
      <div className="section-head">
        <h2>
          <span className="path">{tab.label}</span>
        </h2>
        <Link to={tab.href} className="work-tabs-all dim">
          all {notes.length} →
        </Link>
      </div>

      <div className="work-tabbar" role="tablist" aria-label="section">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            id={`work-tab-${t.key}`}
            aria-selected={t.key === active}
            aria-controls={`work-panel-${t.key}`}
            className="work-tab"
            onClick={() => setActive(t.key)}
          >
            {t.key === active ? "▸ " : "  "}
            {t.label}
            <span className="dim"> ({notesInGroup(t.group).length})</span>
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id={`work-panel-${tab.key}`}
        aria-labelledby={`work-tab-${tab.key}`}
        className="work-panel"
      >
        {shown.length ? (
          <div className="item-list">
            {shown.map((n) => (
              <NoteItem note={n} key={n.slug} />
            ))}
          </div>
        ) : (
          <p className="dim">nothing here yet.</p>
        )}
      </div>
    </section>
  );
}
