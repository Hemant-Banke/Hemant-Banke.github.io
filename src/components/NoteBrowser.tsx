import { useCallback, useMemo, useRef, useState } from "react";
import NoteItem from "./NoteItem";
import type { NoteMeta } from "../content/types";
import { useDismiss } from "../lib/hooks";

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
 * A filterable, sortable list of note items. Used by the projects and research
 * pages. The controls are one line (sort · tags · count); the full tag list
 * lives in a popover dialog so it doesn't crowd the page, and the active tags
 * show (removable) on their own row under the controls. Tag filters are OR'd.
 */
export default function NoteBrowser({ notes }: { notes: NoteMeta[] }) {
  const [sort, setSort] = useState<Sort>("newest");
  const [tags, setTags] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);

  const allTags = useMemo(() => {
    const counts = new Map<string, number>();
    notes.forEach((n) => n.tags.forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1)));
    return [...counts].sort(([a], [b]) => a.localeCompare(b));
  }, [notes]);

  const shown = useMemo(() => {
    const filtered = notes.filter(
      (n) => tags.size === 0 || n.tags.some((t) => tags.has(t)),
    );
    return applySort(filtered, sort);
  }, [notes, tags, sort]);

  const toggleTag = (val: string) =>
    setTags((prev) => {
      const next = new Set(prev);
      next.has(val) ? next.delete(val) : next.add(val);
      return next;
    });

  useDismiss(open, anchorRef, useCallback(() => setOpen(false), []));

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

        {allTags.length > 0 && (
          <div className="browser-group tag-filter" ref={anchorRef}>
            <button
              className="chip tag-filter-btn"
              aria-haspopup="dialog"
              aria-expanded={open}
              aria-pressed={tags.size > 0}
              onClick={() => setOpen((o) => !o)}
            >
              # tags{tags.size > 0 && <span className="accent-green"> ({tags.size})</span>}
              <span className="dim"> {open ? "▴" : "▾"}</span>
            </button>

            {open && (
              <div className="tag-dialog box" role="dialog" aria-label="filter by tag">
                <div className="tag-dialog-bar">
                  <span className="accent-cyan">filter by tag</span>
                  <span className="dim tag-dialog-hint">any match</span>
                  {tags.size > 0 && (
                    <button className="tag-dialog-act" onClick={() => setTags(new Set())}>
                      clear
                    </button>
                  )}
                  <button
                    className="tag-dialog-act"
                    aria-label="close"
                    onClick={() => setOpen(false)}
                  >
                    [x]
                  </button>
                </div>
                <div className="tag-dialog-list">
                  {allTags.map(([t, n]) => (
                    <button
                      key={t}
                      className="chip"
                      aria-pressed={tags.has(t)}
                      onClick={() => toggleTag(t)}
                    >
                      #{t} <span className="dim">{n}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <span className="browser-count dim">
          {shown.length}/{notes.length}
        </span>
      </div>

      {tags.size > 0 && (
        <div className="browser-active">
          {[...tags].sort().map((t) => (
            <button
              key={t}
              className="chip"
              aria-pressed
              aria-label={`remove filter #${t}`}
              onClick={() => toggleTag(t)}
            >
              #{t} <span className="dim">✕</span>
            </button>
          ))}
        </div>
      )}

      {shown.length ? (
        <div className="item-list">
          {shown.map((n) => (
            <NoteItem note={n} key={n.slug} />
          ))}
        </div>
      ) : (
        <p className="lead dim">no pages match those filters.</p>
      )}
    </>
  );
}
