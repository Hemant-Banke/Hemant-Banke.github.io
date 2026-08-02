import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type Simulation,
} from "d3-force";
import type { GraphEdge, GraphNode } from "../content/types";
import { useReducedMotion } from "../lib/hooks";

interface SimNode extends GraphNode {
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}
interface SimLink {
  source: SimNode | string;
  target: SimNode | string;
  kind: GraphEdge["kind"];
}

const nid = (n: SimNode | string) => (typeof n === "string" ? n : n.id);

/**
 * Force-directed knowledge graph drawn entirely in monospace glyphs on a
 * canvas. Group nodes render as box-drawn labels, notes as bulleted labels,
 * edges as stippled ascii lines. Drag to pan, scroll to zoom, hover to trace
 * neighbours, click a note to open it.
 */
export default function AsciiGraph({
  nodes: rawNodes,
  edges: rawEdges,
  height = 560,
  focusId,
  mini = false,
}: {
  nodes: GraphNode[];
  edges: GraphEdge[];
  height?: number;
  focusId?: string;
  mini?: boolean;
}) {
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoverLabel, setHoverLabel] = useState<string | null>(null);

  // Stable working copies (d3 mutates these in place).
  const nodes = useMemo<SimNode[]>(
    () => rawNodes.map((n) => ({ ...n, x: 0, y: 0 })),
    [rawNodes],
  );
  const links = useMemo<SimLink[]>(
    () => rawEdges.map((e) => ({ ...e })),
    [rawEdges],
  );

  // adjacency for hover-tracing
  const adj = useMemo(() => {
    const m = new Map<string, Set<string>>();
    for (const n of nodes) m.set(n.id, new Set());
    for (const e of rawEdges) {
      m.get(e.source)?.add(e.target);
      m.get(e.target)?.add(e.source);
    }
    return m;
  }, [nodes, rawEdges]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Label text/star colours track the theme's CSS custom properties (not
    // hardcoded hex) so they stay legible whichever view is active.
    const readThemeColors = () => {
      const cs = getComputedStyle(canvas);
      return {
        active: cs.getPropertyValue("--ink-strong").trim() || "#eaf3ee",
        dim: cs.getPropertyValue("--dim").trim() || "#6b7a74",
        ink: cs.getPropertyValue("--ink").trim() || "#cdd8d2",
        star: cs.getPropertyValue("--amber").trim() || "#ffc061",
      };
    };
    let themeColors = readThemeColors();
    let isLight = document.documentElement.dataset.theme === "light";

    // Group colours (n.color / s.color / t.color) are baked into the content
    // manifest at dark-theme brightness and don't know about the page theme —
    // on the light view the stippled edge glyphs read as washed-out pastel at
    // low alpha, so darken them (uniform RGB scale keeps hue/saturation,
    // only drops lightness).
    const edgeColorCache = new Map<string, string>();
    const edgeColor = (hex: string) => {
      if (!isLight) return hex;
      const cached = edgeColorCache.get(hex);
      if (cached) return cached;
      const n = parseInt(hex.slice(1), 16);
      const factor = 0.6;
      const r = Math.round(((n >> 16) & 255) * factor);
      const g = Math.round(((n >> 8) & 255) * factor);
      const b = Math.round((n & 255) * factor);
      const out = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
      edgeColorCache.set(hex, out);
      return out;
    };

    const view = { x: 0, y: 0, k: mini ? 0.85 : 1 };
    let hover: string | null = null;
    let selected: string | null = focusId ?? null;
    const rects: { id: string; x0: number; y0: number; x1: number; y1: number }[] =
      [];

    let W = 0;
    let H = 0;
    const resize = () => {
      // Use the canvas's own laid-out width (CSS width:100% of the content box)
      // so we never overflow a padded container.
      const rect = canvas.getBoundingClientRect();
      W = Math.max(1, Math.floor(rect.width) || canvas.parentElement!.clientWidth);
      H = height;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.height = H + "px";
    };
    resize();
    view.x = W / 2;
    view.y = H / 2;

    // seed positions on a loose circle for a pleasant settle
    nodes.forEach((n, i) => {
      const a = (i / nodes.length) * Math.PI * 2;
      const r = 40 + (n.type === "group" ? 0 : 90);
      n.x = Math.cos(a) * r;
      n.y = Math.sin(a) * r;
    });

    const linkDist = (l: SimLink) =>
      l.kind === "contains" ? 70 : l.kind === "subgroup" ? 95 : 150;

    // Collide radius scales with label width so long titles don't overlap.
    const collideR = (d: SimNode) => {
      const chars = d.label.length + (d.type === "group" ? 4 : 2);
      return Math.max(d.type === "group" ? 40 : 26, chars * 3.4);
    };

    const sim: Simulation<SimNode, SimLink> = forceSimulation(nodes)
      .force(
        "link",
        forceLink<SimNode, SimLink>(links)
          .id((d) => d.id)
          .distance(linkDist)
          .strength((l) => (l.kind === "contains" ? 0.9 : 0.3)),
      )
      .force("charge", forceManyBody().strength(mini ? -320 : -560))
      .force("center", forceCenter(0, 0))
      .force("collide", forceCollide<SimNode>(collideR).iterations(2))
      .force("x", forceX(0).strength(0.05))
      .force("y", forceY(0).strength(0.05));

    const FONT = mini ? 12 : 13;

    const glyphForAngle = (a: number) => {
      const d = ((a % Math.PI) + Math.PI) % Math.PI;
      if (d < Math.PI / 8 || d > (7 * Math.PI) / 8) return "─";
      if (d < (3 * Math.PI) / 8) return "╱"; // canvas y-down: this reads correctly
      if (d < (5 * Math.PI) / 8) return "│";
      return "╲";
    };

    const draw = () => {
      const k = view.k;
      const fs = Math.max(9, Math.min(FONT * k, mini ? 15 : 20));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.font = `${fs}px "JetBrains Mono", monospace`;
      ctx.textBaseline = "middle";
      const cw = ctx.measureText("M").width;

      const active = hover ?? selected;
      const lit = new Set<string>();
      if (active) {
        lit.add(active);
        adj.get(active)?.forEach((n) => lit.add(n));
      }
      const isDim = (id: string) => active !== null && !lit.has(id);
      const proj = (n: SimNode) => [n.x * k + view.x, n.y * k + view.y] as const;

      // ---- edges (stippled ascii) ----
      ctx.textAlign = "center";
      for (const l of links) {
        const s = l.source as SimNode;
        const t = l.target as SimNode;
        const [x0, y0] = proj(s);
        const [x1, y1] = proj(t);
        const dx = x1 - x0;
        const dy = y1 - y0;
        const len = Math.hypot(dx, dy);
        const ang = Math.atan2(dy, dx);
        const g = glyphForAngle(ang);
        const incident = active && (nid(l.source) === active || nid(l.target) === active);
        const dim = active && !incident;
        ctx.globalAlpha = dim ? 0.06 : incident ? 0.9 : 0.32;
        ctx.fillStyle = edgeColor(l.kind === "link" ? t.color : s.color);
        const step = Math.max(cw * 0.9, 6);
        for (let d = step; d < len - step; d += step) {
          const px = x0 + (dx * d) / len;
          const py = y0 + (dy * d) / len;
          ctx.fillText(g, px, py);
        }
      }

      // ---- nodes ----
      rects.length = 0;
      for (const n of nodes) {
        const [x, y] = proj(n);
        const dim = isDim(n.id);
        ctx.globalAlpha = dim ? 0.22 : 1;

        if (n.type === "group") {
          const inner = ` ${n.label} `;
          ctx.textAlign = "left";
          ctx.fillStyle = n.color;
          const boxW = (inner.length + 2) * cw;
          const x0 = x - boxW / 2;
          const line = (ln: string, yy: number) => ctx.fillText(ln, x0, yy);
          const top = "┌" + "─".repeat(inner.length) + "┐";
          const mid = "│" + inner + "│";
          const bot = "└" + "─".repeat(inner.length) + "┘";
          ctx.font = `700 ${fs}px "JetBrains Mono", monospace`;
          line(top, y - fs);
          line(mid, y);
          line(bot, y + fs);
          ctx.font = `${fs}px "JetBrains Mono", monospace`;
          rects.push({ id: n.id, x0, y0: y - fs * 1.5, x1: x0 + boxW, y1: y + fs * 1.5 });
        } else {
          ctx.textAlign = "left";
          const label = n.label;
          const dotW = cw * 1.4;
          const totalW = dotW + label.length * cw;
          const x0 = x - totalW / 2;
          // starred notes get an amber ★ instead of the group-coloured bullet
          ctx.fillStyle = n.star ? themeColors.star : n.color;
          ctx.fillText(n.star ? "★" : "●", x0, y);
          ctx.fillStyle = active === n.id ? themeColors.active : dim ? themeColors.dim : themeColors.ink;
          ctx.fillText(label, x0 + dotW, y);
          rects.push({
            id: n.id,
            x0,
            y0: y - fs * 0.8,
            x1: x0 + totalW,
            y1: y + fs * 0.8,
          });
        }
      }
      ctx.globalAlpha = 1;
    };

    // Frame the whole graph once it settles: measure label extents in world
    // space and pick a zoom/pan that fits with margin.
    let fitted = false;
    const fitView = () => {
      if (!nodes.length) return;
      ctx.font = `${FONT}px "JetBrains Mono", monospace`;
      const cw = ctx.measureText("M").width;
      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;
      for (const n of nodes) {
        const halfW =
          n.type === "group"
            ? ((n.label.length + 4) * cw) / 2
            : (n.label.length * cw + cw * 1.4) / 2;
        const halfH = n.type === "group" ? FONT * 1.8 : FONT;
        minX = Math.min(minX, n.x - halfW);
        maxX = Math.max(maxX, n.x + halfW);
        minY = Math.min(minY, n.y - halfH);
        maxY = Math.max(maxY, n.y + halfH);
      }
      const spanX = Math.max(1, maxX - minX);
      const spanY = Math.max(1, maxY - minY);
      const k = Math.min(W / spanX, H / spanY, mini ? 1.1 : 1.35) * 0.9;
      view.k = Math.max(0.2, k);
      view.x = W / 2 - ((minX + maxX) / 2) * view.k;
      view.y = H / 2 - ((minY + maxY) / 2) * view.k;
    };

    // Draw is driven by simulation ticks while it's warm, and by explicit calls
    // on interaction once it settles — no always-on animation frame.
    sim.on("tick", draw);
    sim.on("end", () => {
      if (!fitted) {
        fitted = true;
        fitView();
      }
      draw();
    });

    if (reduced) {
      sim.stop();
      sim.tick(300);
      fitView();
      draw();
    } else {
      sim.alpha(1).restart();
    }

    // ---- interaction ----
    const toWorld = (sx: number, sy: number) =>
      [(sx - view.x) / view.k, (sy - view.y) / view.k] as const;
    const hit = (sx: number, sy: number) => {
      for (let i = rects.length - 1; i >= 0; i--) {
        const r = rects[i];
        if (sx >= r.x0 && sx <= r.x1 && sy >= r.y0 && sy <= r.y1) return r.id;
      }
      return null;
    };

    let dragNode: SimNode | null = null;
    let panning = false;
    let last = { x: 0, y: 0 };
    let downAt = { x: 0, y: 0 };
    let moved = false;
    // Active pointers, so two fingers can pinch-zoom on touch devices.
    const pointers = new Map<number, { x: number; y: number }>();
    let pinchDist = 0;

    const pos = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    // Zoom by `factor` about screen point (mx,my), keeping that point fixed.
    const zoomAt = (factor: number, mx: number, my: number) => {
      const [wx, wy] = toWorld(mx, my);
      view.k = Math.min(3, Math.max(0.3, view.k * factor));
      view.x = mx - wx * view.k;
      view.y = my - wy * view.k;
      draw();
    };
    const pinchDistance = () => {
      const [a, b] = [...pointers.values()];
      return Math.hypot(a.x - b.x, a.y - b.y);
    };
    const pinchMid = () => {
      const [a, b] = [...pointers.values()];
      return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    };

    const onDown = (e: PointerEvent) => {
      const p = pos(e);
      pointers.set(e.pointerId, p);
      canvas.setPointerCapture(e.pointerId);
      if (pointers.size >= 2) {
        // Entering a pinch — abandon any single-finger pan/drag in progress.
        if (dragNode) {
          if (!reduced) sim.alphaTarget(0);
          dragNode.fx = null;
          dragNode.fy = null;
          dragNode = null;
        }
        panning = false;
        pinchDist = pinchDistance();
        return;
      }
      downAt = p;
      moved = false;
      const id = hit(p.x, p.y);
      if (id) {
        const n = nodes.find((nn) => nn.id === id)!;
        dragNode = n;
        if (!reduced) sim.alphaTarget(0.15).restart();
        n.fx = n.x;
        n.fy = n.y;
      } else {
        panning = true;
        last = p;
      }
    };
    const onMove = (e: PointerEvent) => {
      const p = pos(e);
      if (pointers.has(e.pointerId)) pointers.set(e.pointerId, p);
      if (pointers.size >= 2) {
        const d = pinchDistance();
        if (pinchDist > 0 && d > 0) {
          const mid = pinchMid();
          zoomAt(d / pinchDist, mid.x, mid.y);
        }
        pinchDist = d;
        return;
      }
      if (Math.hypot(p.x - downAt.x, p.y - downAt.y) > 4) moved = true;
      if (dragNode) {
        const [wx, wy] = toWorld(p.x, p.y);
        dragNode.fx = wx;
        dragNode.fy = wy;
        if (reduced) draw();
      } else if (panning) {
        view.x += p.x - last.x;
        view.y += p.y - last.y;
        last = p;
        draw();
      } else {
        const id = hit(p.x, p.y);
        if (id !== hover) {
          hover = id;
          const n = id ? nodes.find((nn) => nn.id === id) : null;
          setHoverLabel(n ? `${n.type === "group" ? "group " : ""}${n.label}` : null);
          canvas.style.cursor = id ? "pointer" : "grab";
          draw();
        }
      }
    };
    const onUp = (e: PointerEvent) => {
      canvas.releasePointerCapture(e.pointerId);
      const wasPinching = pointers.size >= 2;
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinchDist = 0;
      // Still mid-gesture (a finger remains, or we were pinching) — not a click.
      if (wasPinching || pointers.size >= 1) {
        draw();
        return;
      }
      if (dragNode) {
        if (!reduced) sim.alphaTarget(0);
        if (!moved) {
          // treat as click
          if (dragNode.type === "note") navigate(`/digital-garden/${dragNode.id}`);
          else selected = selected === dragNode.id ? null : dragNode.id;
        }
        dragNode.fx = null;
        dragNode.fy = null;
        dragNode = null;
      } else if (panning && !moved) {
        selected = null; // click empty space clears selection
      }
      panning = false;
      draw();
    };
    const onCancel = (e: PointerEvent) => {
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinchDist = 0;
      if (dragNode) {
        dragNode.fx = null;
        dragNode.fy = null;
        dragNode = null;
      }
      panning = false;
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      zoomAt(Math.exp(-e.deltaY * 0.0015), e.clientX - rect.left, e.clientY - rect.top);
    };

    const onThemeChange = () => {
      themeColors = readThemeColors();
      isLight = document.documentElement.dataset.theme === "light";
      draw();
    };
    window.addEventListener("themechange", onThemeChange);

    canvas.style.cursor = "grab";
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onCancel);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    const ro = new ResizeObserver(() => {
      resize();
      draw();
    });
    ro.observe(canvas.parentElement!);

    return () => {
      sim.stop();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onCancel);
      canvas.removeEventListener("wheel", onWheel);
      ro.disconnect();
      window.removeEventListener("themechange", onThemeChange);
    };
  }, [nodes, links, adj, height, reduced, navigate, focusId, mini]);

  return (
    <div className="graph-wrap" style={{ height }}>
      <canvas ref={canvasRef} className="graph-canvas" />
      {!mini && (
        <div className="graph-hint dim" aria-hidden="true">
          drag · scroll to zoom · hover to trace · click a ● to open
        </div>
      )}
      {hoverLabel && (
        <div className="graph-tip" aria-hidden="true">
          {hoverLabel}
        </div>
      )}
    </div>
  );
}
