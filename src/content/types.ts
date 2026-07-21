// Shape of the content manifest produced at build time by
// plugins/vite-plugin-content.ts. Everything the app knows about the garden
// (notes, folder-groups, the knowledge graph, the folder tree) lives here.

export type NodeType = "note" | "group";

// A primary/artifact link on a page (frontmatter `links:`) — repo, pdf, demo…
export interface Artifact {
  label: string;
  href: string;
}

export interface NoteMeta {
  slug: string; // route id, e.g. "systems/append-only-logs"
  title: string;
  group: string; // owning folder path relative to digital-garden/, e.g. "systems"
  groupSlug: string; // graph id of the owning group node
  file: string; // path relative to digital-garden/, e.g. "systems/logs.md"
  date?: string;
  tags: string[];
  summary?: string;
  byline?: string; // optional subtitle, e.g. authors · venue (used by research)
  status?: string; // optional badge, e.g. "shipped" / "wip" (used by projects)
  star: boolean; // featured — surfaced in the curated section
  artifacts: Artifact[]; // primary links (pdf, github, demo…) from frontmatter
  html: string; // rendered markdown body
  wordCount: number;
  links: string[]; // note slugs this note points at (resolved wiki-links)
  brokenLinks: string[]; // wiki-link targets that resolved to nothing
  backlinks: string[]; // note slugs that point at this note
}

export interface GroupMeta {
  slug: string; // graph id, e.g. "group:systems"
  name: string; // display name, e.g. "systems"
  path: string; // folder path relative to digital-garden/
  parent?: string; // parent group slug, if nested
  color: string; // accent hex assigned deterministically
  noteSlugs: string[];
}

export interface GraphNode {
  id: string; // note slug or group slug
  type: NodeType;
  label: string;
  group: string; // group path, used for coloring
  color: string;
  degree: number; // number of incident edges
  star?: boolean; // featured note — drawn with a ★
}

export interface GraphEdge {
  source: string;
  target: string;
  kind: "contains" | "link" | "subgroup";
}

export interface TreeNode {
  type: NodeType;
  name: string;
  slug: string;
  color?: string;
  star?: boolean;
  children?: TreeNode[];
}

export interface Manifest {
  notes: NoteMeta[];
  groups: GroupMeta[];
  graph: { nodes: GraphNode[]; edges: GraphEdge[] };
  tree: TreeNode[];
  generatedAt: string;
}
