// Pre-baked graph layouts. The layout is a pure function of the content, so it
// runs here at build time instead of settling d3-force in the browser on every
// mount. Emits world-space positions for every graph the site draws:
//
//   full          — the whole knowledge graph (garden index)
//   notes[<slug>] — one subset graph per note (the note page's local graph)
//
// A seeded LCG keeps the output stable across builds.
// Types for this shape live in src/content/types.ts.
import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
} from "d3-force";

// d3's forces jiggle coincident nodes with random(); seed it for determinism.
function lcg(seed = 0x2545f491) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const SEED = 0x2545f491;
// Ticks to run before reading positions. d3's own default cooling schedule
// settles in ~300; a little headroom costs nothing at build time.
const TICKS = 420;

// Force configuration — must stay in step with AsciiGraph.tsx.
//
// Obsidian-style dynamics: one uniform link distance, charge that stops acting
// past DISTANCE_MAX, and a centring pull strong enough to gather everything
// into a single round blob rather than letting arms sprawl. Collision is a
// plain circle sized by the node; sizing it to the label's width was what made
// the old layout a wide, ragged sheet (measured aspect 1.41 → 1.00).
export const LINK_DISTANCE = 58;
export const CHARGE = -220;
export const DISTANCE_MAX = 300;
export const CENTER_PULL = 0.09;

const linkStrength = (l) => (l.kind === "contains" ? 0.68 : 0.34);

/** Circular collision radius; hubs take up more room, as in Obsidian. */
export const nodeRadius = (d) =>
  (d.type === "group" ? 30 : 14) + Math.min(d.degree ?? 0, 10) * 1.6;

/** Run the force layout for one graph, returning `{ id: [x, y] }` in world space. */
export function layoutGraph(nodes, edges, { seed = SEED } = {}) {
  if (!nodes.length) return {};

  // Same loose-circle seeding AsciiGraph uses, so the sim starts from the same
  // basin and settles into a comparable arrangement.
  const simNodes = nodes.map((n, i) => {
    const a = (i / nodes.length) * Math.PI * 2;
    const r = 40 + (n.type === "group" ? 0 : 90);
    return {
      id: n.id,
      type: n.type,
      label: n.label,
      degree: n.degree,
      x: Math.cos(a) * r,
      y: Math.sin(a) * r,
    };
  });
  const simLinks = edges.map((e) => ({ ...e }));

  const sim = forceSimulation(simNodes)
    .randomSource(lcg(seed))
    .force(
      "link",
      forceLink(simLinks)
        .id((d) => d.id)
        .distance(LINK_DISTANCE)
        .strength(linkStrength),
    )
    .force(
      "charge",
      forceManyBody().strength(CHARGE).distanceMax(DISTANCE_MAX),
    )
    .force("center", forceCenter(0, 0))
    .force("collide", forceCollide(nodeRadius).iterations(3))
    .force("x", forceX(0).strength(CENTER_PULL))
    .force("y", forceY(0).strength(CENTER_PULL))
    .stop();

  sim.tick(TICKS);

  const positions = {};
  for (const n of simNodes) {
    positions[n.id] = [round(n.x), round(n.y)];
  }
  return positions;
}

const round = (v) => Math.round((Number.isFinite(v) ? v : 0) * 100) / 100;

/** The note, every node one edge away, and the edges among them. */
export function neighbourhood(graph, slug) {
  const keep = new Set([slug]);
  for (const e of graph.edges) {
    if (e.source === slug) keep.add(e.target);
    if (e.target === slug) keep.add(e.source);
  }
  const nodes = graph.nodes.filter((n) => keep.has(n.id));
  const edges = graph.edges.filter(
    (e) => keep.has(e.source) && keep.has(e.target),
  );
  return { nodes, edges };
}

// Per-graph seed, so each gets an independent but reproducible jiggle.
function seedFor(key) {
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h ^ SEED) >>> 0;
}

/** Lay out every graph the site draws, from an already-built manifest. */
export function buildLayouts(manifest) {
  const full = {
    positions: layoutGraph(manifest.graph.nodes, manifest.graph.edges, {
      seed: seedFor("full"),
    }),
  };

  const notes = {};
  for (const note of manifest.notes) {
    const { nodes, edges } = neighbourhood(manifest.graph, note.slug);
    // Nothing to draw; the note page hides the mini-graph anyway.
    if (nodes.length < 2) continue;
    notes[note.slug] = {
      nodeIds: nodes.map((n) => n.id),
      edges,
      positions: layoutGraph(nodes, edges, { seed: seedFor(note.slug) }),
    };
  }

  return { full, notes, generatedAt: new Date().toISOString() };
}
