import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { TreeNode } from "../content/types";

interface Row {
  node: TreeNode;
  prefix: string; // ancestor connector columns
  connector: string; // this row's ├── / └──
  hasChildren: boolean;
  collapsed: boolean;
}

/**
 * `tree`-command style explorer. Groups collapse/expand; notes navigate. Fully
 * keyboard operable (Enter/Space activate a focused row).
 */
export default function FileTree({
  tree,
  activeSlug,
}: {
  tree: TreeNode[];
  activeSlug?: string;
}) {
  const navigate = useNavigate();
  // On phone-width screens the explorer starts fully collapsed so it doesn't
  // dominate the page; on larger screens folders start open.
  const [collapsed, setCollapsed] = useState<Set<string>>(() => {
    const set = new Set<string>();
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 768px)").matches
    ) {
      const collect = (nodes: TreeNode[]) => {
        for (const n of nodes) {
          if (n.children?.length) {
            set.add(n.slug);
            collect(n.children);
          }
        }
      };
      collect(tree);
    }
    return set;
  });

  const rows = useMemo(() => {
    const out: Row[] = [];
    const walk = (nodes: TreeNode[], prefix: string) => {
      nodes.forEach((node, i) => {
        const isLast = i === nodes.length - 1;
        const hasChildren = !!node.children?.length;
        const isCollapsed = collapsed.has(node.slug);
        out.push({
          node,
          prefix,
          connector: isLast ? "└── " : "├── ",
          hasChildren,
          collapsed: isCollapsed,
        });
        if (hasChildren && !isCollapsed) {
          walk(node.children!, prefix + (isLast ? "    " : "│   "));
        }
      });
    };
    walk(tree, "");
    return out;
  }, [tree, collapsed]);

  const toggle = (slug: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(slug) ? next.delete(slug) : next.add(slug);
      return next;
    });

  const activate = (row: Row) => {
    if (row.node.type === "group") toggle(row.node.slug);
    else navigate(`/digital-garden/${row.node.slug}`);
  };

  return (
    <div className="box filetree">
      <span className="box-title">explorer — ~/digital-garden</span>
      <div className="filetree-root accent-green">digital-garden/</div>
      <ul className="filetree-list" role="tree">
        {rows.map((row) => {
          const { node } = row;
          const isGroup = node.type === "group";
          const active = node.slug === activeSlug;
          const glyph = isGroup ? (row.collapsed ? "▸" : "▾") : "●";
          return (
            <li
              key={node.slug + row.prefix}
              role="treeitem"
              aria-expanded={isGroup ? !row.collapsed : undefined}
              aria-selected={active}
              tabIndex={0}
              className={
                "filetree-row" +
                (isGroup ? " group" : " note") +
                (active ? " active" : "")
              }
              onClick={() => activate(row)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  activate(row);
                }
              }}
            >
              <span className="filetree-prefix" aria-hidden="true">
                {row.prefix}
                {row.connector}
              </span>
              <span
                className="filetree-glyph"
                style={{ color: node.color }}
                aria-hidden="true"
              >
                {glyph}
              </span>
              <span className="filetree-name">{node.name}</span>
              {node.star && (
                <span className="star-badge filetree-star" aria-label="featured">
                  {" "}
                  ★
                </span>
              )}
              {isGroup && (
                <span className="filetree-count dim">
                  {" "}
                  {countNotes(node)} notes
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function countNotes(node: TreeNode): number {
  if (node.type === "note") return 1;
  return (node.children ?? []).reduce((n, c) => n + countNotes(c), 0);
}
