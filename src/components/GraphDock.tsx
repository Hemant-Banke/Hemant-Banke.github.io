import { useEffect, useRef, useState } from "react";
import AsciiGraph from "./AsciiGraph";
import type { GraphEdge, GraphNode, GraphPositions } from "../content/types";

const PHONE = "(max-width: 640px)";
// Grace period so the pointer can cross the gap between thumbnail and window.
const CLOSE_DELAY = 180;

function useIsPhone(): boolean {
  const [phone, setPhone] = useState(
    () => typeof matchMedia !== "undefined" && matchMedia(PHONE).matches,
  );
  useEffect(() => {
    const mq = matchMedia(PHONE);
    const on = () => setPhone(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return phone;
}

/**
 * The note-page local graph, docked in the header as a small square
 * thumbnail. Hovering (or focusing / clicking) it opens a window anchored to
 * the same corner with a full, interactive graph; leaving closes it. Not
 * rendered on phones.
 */
export default function GraphDock({
  nodes,
  edges,
  positions,
  focusId,
}: {
  nodes: GraphNode[];
  edges: GraphEdge[];
  positions?: GraphPositions;
  focusId: string;
}) {
  const phone = useIsPhone();
  const [open, setOpen] = useState(false);
  const timer = useRef<number>(0);

  const show = () => {
    window.clearTimeout(timer.current);
    setOpen(true);
  };
  const hide = () => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(false), CLOSE_DELAY);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  if (phone) return null;

  return (
    <div className="graph-dock" onMouseEnter={show} onMouseLeave={hide}>
      <button
        type="button"
        className="graph-dock-thumb"
        aria-label="open local graph"
        aria-expanded={open}
        onClick={show}
        onFocus={show}
      >
        <AsciiGraph
          nodes={nodes}
          edges={edges}
          positions={positions}
          height={136}
          focusId={focusId}
          mini
        />
      </button>

      {open && (
        <div className="graph-dock-win box" role="dialog" aria-label="local graph">
          <div className="graph-dock-bar">
            <span className="accent-cyan">local graph</span>
            <span className="dim graph-dock-hint">drag · scroll · click ●</span>
            <button
              type="button"
              className="graph-dock-close"
              aria-label="close local graph"
              onClick={() => setOpen(false)}
            >
              [x]
            </button>
          </div>
          <AsciiGraph
            nodes={nodes}
            edges={edges}
            positions={positions}
            height={380}
            focusId={focusId}
            mini
          />
        </div>
      )}
    </div>
  );
}
