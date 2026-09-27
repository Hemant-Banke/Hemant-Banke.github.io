import { useState } from "react";
import { Link } from "react-router-dom";
import NoteItem from "./NoteItem";
import { notesInGroup } from "../content/manifest";

/**
 * Research and projects on the home page: a segmented switch next to the
 * heading over the same line items the full listings use. Switching re-keys
 * the list so it slides in from the side you switched toward. The full,
 * filterable listings live on /research and /projects.
 */

const TABS = [
  { key: "research", label: "research", href: "/research" },
  { key: "projects", label: "projects", href: "/projects" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

// How many items to show before deferring to the full listing.
const PREVIEW = 4;

export default function WorkTabs() {
  const [active, setActive] = useState<TabKey>("research");
  const index = TABS.findIndex((t) => t.key === active);
  const tab = TABS[index];
  const notes = notesInGroup(tab.key);
  const shown = notes.slice(0, PREVIEW);

  return (
    <section className="work" aria-labelledby="work-heading">
      <div className="work-head">
        <h2 id="work-heading" className="work-title">
          Selected work
        </h2>
        <div className="work-switch" role="tablist" aria-label="section">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              id={`work-tab-${t.key}`}
              aria-selected={t.key === active}
              aria-controls="work-panel"
              className="work-switch-btn"
              onClick={() => setActive(t.key)}
            >
              {t.label}
              <span className="work-switch-n">{notesInGroup(t.key).length}</span>
            </button>
          ))}
        </div>
      </div>

      <div
        key={tab.key}
        role="tabpanel"
        id="work-panel"
        aria-labelledby={`work-tab-${tab.key}`}
        className={"work-panel " + (index === 0 ? "from-left" : "from-right")}
      >
        {shown.length ? (
          <div className="item-list">
            {shown.map((n) => (
              <NoteItem note={n} showTags={false} key={n.slug} />
            ))}
          </div>
        ) : (
          <p className="dim">nothing here yet.</p>
        )}
        <Link to={tab.href} className="work-all">
          all {notes.length} {tab.label} →
        </Link>
      </div>
    </section>
  );
}
