// Content pipeline core, in plain JS so it runs on any Node (build prestep +
// CI) without a TypeScript loader. Scans digital-garden/ and produces the manifest:
// notes, folder-groups, the knowledge graph, and the folder tree.
// Types for this shape live in src/content/types.ts.
import { promises as fs } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import MarkdownIt from "markdown-it";
import slugify from "slugify";
import { buildLayouts } from "./graph-layout.mjs";

// Deterministic accent palette for folder-groups. Mirrors the CSS accents.
export const GROUP_COLORS = [
  "#45f08a", // green
  "#43d1e6", // cyan
  "#ff6ad5", // magenta
  "#ffc061", // amber
  "#8b7cff", // violet
  "#57d9a3", // teal
  "#f6f177", // yellow
  "#ff8f6b", // coral
];

const md = new MarkdownIt({
  html: true, // garden content is authored by the site owner; trusted
  linkify: true,
  breaks: false,
  typographer: true,
});

const slug = (s) =>
  slugify(s, { lower: true, strict: true, trim: true }) || "untitled";

// Slugify a path segment-by-segment so folder structure survives in the id.
const slugPath = (p) => p.split("/").map(slug).join("/");

async function walk(dir, base) {
  const out = [];
  let entries = [];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (e.name.startsWith(".")) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      out.push(...(await walk(full, base)));
    } else if (e.isFile() && e.name.toLowerCase().endsWith(".md")) {
      out.push(path.relative(base, full).split(path.sep).join("/"));
    }
  }
  return out;
}

// YAML parses unquoted dates into JS Date objects; normalise everything to a
// plain ISO day string (YYYY-MM-DD).
function formatDate(value) {
  if (!value) return undefined;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const s = String(value);
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? s : d.toISOString().slice(0, 10);
}

function titleFromFilename(file) {
  const name = file.split("/").pop().replace(/\.md$/i, "");
  return name.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// Frontmatter `links:` → primary artifact links. Accepts a list of
// {label, href} or bare url strings.
function parseArtifacts(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((l) => {
      if (typeof l === "string") return { label: l, href: l };
      const href = l && l.href != null ? String(l.href) : "";
      const label = l && l.label != null ? String(l.label) : href;
      return { label, href };
    })
    .filter((l) => l.href);
}

// Replace [[wiki-links]] with anchors, protecting code spans/blocks.
function transformWikiLinks(body, resolve) {
  const links = new Set();
  const broken = [];
  const pattern = /(```[\s\S]*?```|`[^`\n]*`)|\[\[([^\]\n]+)\]\]/g;
  const out = body.replace(pattern, (whole, code, wiki) => {
    if (code) return whole; // leave code untouched
    const raw = wiki.trim();
    const [targetPart, aliasPart] = raw.split("|");
    const target = targetPart.trim();
    const alias = (aliasPart ?? targetPart).trim();
    const resolved = resolve(target);
    if (resolved) {
      links.add(resolved);
      return `<a class="wikilink" data-internal="1" data-slug="${resolved}" href="/digital-garden/${resolved}">${alias}</a>`;
    }
    broken.push(target);
    return `<a class="wikilink broken" title="unresolved link: ${target}">${alias}</a>`;
  });
  return { out, links: [...links], broken };
}

function wordCount(body) {
  return (body.trim().match(/\S+/g) || []).length;
}

function sortNotes(a, b) {
  if (a.date && b.date) return a.date < b.date ? 1 : a.date > b.date ? -1 : 0;
  if (a.date) return -1;
  if (b.date) return 1;
  return a.title.localeCompare(b.title);
}

export async function buildManifest(gardenDir) {
  const files = (await walk(gardenDir, gardenDir)).sort();

  // Pass 1: read + parse frontmatter, build lookup for wiki resolution.
  const raw = [];
  for (const file of files) {
    const abs = path.join(gardenDir, file);
    const src = await fs.readFile(abs, "utf8");
    const { data, content } = matter(src);
    const group = file.includes("/")
      ? file.slice(0, file.lastIndexOf("/"))
      : "";
    const noteSlug = slugPath(file.replace(/\.md$/i, ""));
    raw.push({
      file,
      group,
      noteSlug,
      title: data.title || titleFromFilename(file),
      date: formatDate(data.date),
      tags: Array.isArray(data.tags)
        ? data.tags.map(String)
        : data.tags
          ? [String(data.tags)]
          : [],
      summary: data.summary ? String(data.summary) : undefined,
      byline: data.byline ? String(data.byline) : undefined,
      status: data.status ? String(data.status) : undefined,
      star: data.star === true || data.star === "true" || data.featured === true,
      artifacts: parseArtifacts(data.links),
      body: content,
    });
  }

  // Resolution index: match wiki targets by title, filename, or full slug.
  const byKey = new Map();
  const norm = (s) => s.trim().toLowerCase();
  for (const n of raw) {
    const filename = n.file.split("/").pop().replace(/\.md$/i, "");
    for (const key of [n.title, filename, n.noteSlug, n.file]) {
      if (key && !byKey.has(norm(key))) byKey.set(norm(key), n.noteSlug);
    }
  }
  const resolve = (target) => {
    const t = target.replace(/\.md$/i, "");
    return (
      byKey.get(norm(t)) ??
      byKey.get(norm(slugPath(t))) ??
      byKey.get(norm(t.split("/").pop() || t)) ??
      null
    );
  };

  // Pass 2: render notes.
  const notes = raw.map((n) => {
    const { out, links, broken } = transformWikiLinks(n.body, resolve);
    return {
      slug: n.noteSlug,
      title: n.title,
      group: n.group || "root",
      groupSlug: "group:" + (n.group ? slugPath(n.group) : "root"),
      file: n.file,
      date: n.date,
      tags: n.tags,
      summary: n.summary,
      byline: n.byline,
      status: n.status,
      star: n.star,
      artifacts: n.artifacts,
      html: md.render(out),
      wordCount: wordCount(n.body),
      links,
      brokenLinks: broken,
      backlinks: [],
    };
  });

  // Backlinks.
  const bySlug = new Map(notes.map((n) => [n.slug, n]));
  for (const n of notes) {
    for (const target of n.links) {
      const t = bySlug.get(target);
      if (t && !t.backlinks.includes(n.slug)) t.backlinks.push(n.slug);
    }
  }

  // Groups: every folder that appears becomes a group node.
  const groupPaths = new Set();
  for (const n of raw) {
    if (!n.group) continue;
    const parts = n.group.split("/");
    for (let i = 0; i < parts.length; i++) {
      groupPaths.add(parts.slice(0, i + 1).join("/"));
    }
  }
  const sortedGroups = [...groupPaths].sort();
  const groups = sortedGroups.map((p, i) => {
    const parts = p.split("/");
    const parent = parts.length > 1 ? parts.slice(0, -1).join("/") : undefined;
    return {
      slug: "group:" + slugPath(p),
      name: parts[parts.length - 1],
      path: p,
      parent: parent ? "group:" + slugPath(parent) : undefined,
      color: GROUP_COLORS[i % GROUP_COLORS.length],
      noteSlugs: notes.filter((n) => n.group === p).map((n) => n.slug),
    };
  });
  const groupColor = new Map(groups.map((g) => [g.slug, g.color]));

  // Graph nodes + edges.
  const nodes = [];
  const edges = [];
  const degree = new Map();
  const bump = (id) => degree.set(id, (degree.get(id) || 0) + 1);

  for (const g of groups) {
    nodes.push({
      id: g.slug,
      type: "group",
      label: g.name,
      group: g.path,
      color: g.color,
      degree: 0,
    });
    if (g.parent) {
      edges.push({ source: g.parent, target: g.slug, kind: "subgroup" });
      bump(g.parent);
      bump(g.slug);
    }
  }
  for (const n of notes) {
    const color = groupColor.get(n.groupSlug) || GROUP_COLORS[0];
    nodes.push({
      id: n.slug,
      type: "note",
      label: n.title,
      group: n.group,
      color,
      degree: 0,
      star: n.star,
    });
    if (n.group !== "root") {
      edges.push({ source: n.groupSlug, target: n.slug, kind: "contains" });
      bump(n.groupSlug);
      bump(n.slug);
    }
  }
  const nodeIds = new Set(nodes.map((n) => n.id));
  for (const n of notes) {
    for (const target of n.links) {
      if (target === n.slug || !nodeIds.has(target)) continue;
      edges.push({ source: n.slug, target, kind: "link" });
      bump(n.slug);
      bump(target);
    }
  }
  for (const node of nodes) node.degree = degree.get(node.id) || 0;

  // Folder tree (nested), notes sorted newest-first.
  const noteToTree = (n, color) => ({
    type: "note",
    name: n.title,
    slug: n.slug,
    color,
    star: n.star,
  });
  const buildTree = (parentPath) => {
    const childGroups = groups.filter((g) => {
      const gp = g.path.includes("/")
        ? g.path.slice(0, g.path.lastIndexOf("/"))
        : "";
      return (parentPath ?? "") === gp;
    });
    const groupNodes = childGroups.map((g) => ({
      type: "group",
      name: g.name,
      slug: g.slug,
      color: g.color,
      children: [
        ...buildTree(g.path),
        ...notes
          .filter((n) => n.group === g.path)
          .sort(sortNotes)
          .map((n) => noteToTree(n, g.color)),
      ],
    }));
    if (parentPath === undefined) {
      const rootNotes = notes
        .filter((n) => n.group === "root")
        .sort(sortNotes)
        .map((n) => noteToTree(n, GROUP_COLORS[0]));
      return [...groupNodes, ...rootNotes];
    }
    return groupNodes;
  };

  return {
    notes,
    groups,
    graph: { nodes, edges },
    tree: buildTree(undefined),
    generatedAt: new Date().toISOString(),
  };
}

export const MANIFEST_FILE = "manifest.json";
export const LAYOUTS_FILE = "layouts.json";

// Build the manifest + the pre-baked graph layouts and write both into
// `outDir` (src/generated/). Shared by the Vite plugin and the standalone
// build prestep — the two files are always generated together so the layouts
// can never describe a stale graph.
export async function writeContent(gardenDir, outDir) {
  const manifest = await buildManifest(gardenDir);
  const layouts = buildLayouts(manifest);
  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(
    path.join(outDir, MANIFEST_FILE),
    JSON.stringify(manifest, null, 2),
  );
  await fs.writeFile(
    path.join(outDir, LAYOUTS_FILE),
    JSON.stringify(layouts, null, 2),
  );
  return { manifest, layouts };
}
