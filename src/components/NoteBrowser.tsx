import { useMemo, useState } from "react";
import NoteCard from "./NoteCard";
import type { NoteMeta } from "../content/types";

type Sort = "newest" | "oldest" | "a–z";

function applySort(notes: NoteMeta[], sort: Sort): NoteMeta[] {
  const arr = [...notes];
  if (sort === "a–z") {
    arr.sort((a, b) => a.title.localeCompare(b.title));
    return arr;
  }
  arr.sort((a, b) => {
    const ad = a.date ?? "";
    const bd = b.date ?? "";
    if (ad === bd) return a.title.localeCompare(b.title);
    return sort === "newest" ? (ad < bd ? 1 : -1) : ad < bd ? -1 : 1;
  });
  return arr;
}

/**
 * A filterable, sortable grid of note cards. Used by the projects, research, and
 * curated pages. Tag filters are OR'd; the optional group filter (for lists that
 * span folders, like curated) is OR'd too.
 */
export default function NoteBrowser({
  notes,
  groups = false,
}: {
  notes: NoteMeta[];
  groups?: boolean;
}) {
  const [sort, setSort] = useState<Sort>("newest");
  const [tags, setTags] = useState<Set<string>>(new Set());
  const [grps, setGrps] = useState<Set<string>>(new Set());

  const allTags = useMemo(() => {
    const set = new Set<string>();
    notes.forEach((n) => n.tags.forEach((t) => set.add(t)));
    return [...set].sort();
  }, [notes]);

  const allGroups = useMemo(
    () => [...new Set(notes.map((n) => n.group))].sort(),
    [notes],
  );

  const shown = useMemo(() => {
    const filtered = notes.filter((n) => {
      const tagOk = tags.size === 0 || n.tags.some((t) => tags.has(t));
      const grpOk = grps.size === 0 || grps.has(n.group);
      return tagOk && grpOk;
    });
    return applySort(filtered, sort);
  }, [notes, tags, grps, sort]);

  const toggle =
    (setter: React.Dispatch<React.SetStateAction<Set<string>>>) =>
    (val: string) =>
      setter((prev) => {
        const next = new Set(prev);
        next.has(val) ? next.delete(val) : next.add(val);
        return next;
      });
  const toggleTag = toggle(setTags);
  const toggleGrp = toggle(setGrps);

  return (
    <>
      <div className="browser-controls">
        <div className="browser-group">
          <span className="browser-label dim">sort</span>
          {(["newest", "oldest", "a–z"] as Sort[]).map((s) => (
            <button
              key={s}
              className="chip"
              aria-pressed={sort === s}
              onClick={() => setSort(s)}
            >
              {s}
            </button>
          ))}
        </div>

        {groups && allGroups.length > 1 && (
          <div className="browser-group">
            <span className="browser-label dim">group</span>
            {allGroups.map((g) => (
              <button
                key={g}
                className="chip"
                aria-pressed={grps.has(g)}
                onClick={() => toggleGrp(g)}
              >
                {g}
              </button>
            ))}
          </div>
        )}

        {allTags.length > 0 && (
          <div className="browser-group">
            <span className="browser-label dim">tag</span>
            {allTags.map((t) => (
              <button
                key={t}
                className="chip"
                aria-pressed={tags.has(t)}
                onClick={() => toggleTag(t)}
              >
                #{t}
              </button>
            ))}
            {(tags.size > 0 || grps.size > 0) && (
              <button
                className="chip chip-clear"
                onClick={() => {
                  setTags(new Set());
                  setGrps(new Set());
                }}
              >
                ✕ clear
              </button>
            )}
          </div>
        )}

        <span className="browser-count dim">
          {shown.length}/{notes.length}
        </span>
      </div>

      {shown.length ? (
        <div className="card-grid">
          {shown.map((n) => (
            <NoteCard note={n} key={n.slug} />
          ))}
        </div>
      ) : (
        <p className="lead dim">no pages match those filters.</p>
      )}
    </>
  );
}
