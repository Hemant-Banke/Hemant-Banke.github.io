import { Link } from "react-router-dom";
import type { Artifact } from "../content/types";

// Everything here opens a page — in-site routes go through the router, the
// rest open in a new tab — so they all take the same "opens elsewhere" arrow.
function glyph(a: Artifact): string {
  return a.href.startsWith("/") && !a.href.toLowerCase().endsWith(".pdf")
    ? "→"
    : "↗";
}

// Only paths that resolve to an actual app route should go through the
// router's <Link>; static assets (pdfs, etc.) need a real browser
// navigation or they 404 against the client-side route table.
function isInternalRoute(a: Artifact): boolean {
  return a.href.startsWith("/") && !a.href.toLowerCase().endsWith(".pdf");
}

/** Row of a page's primary/artifact links (repo, pdf, demo…). */
export default function ArtifactLinks({
  artifacts,
  className = "",
}: {
  artifacts: Artifact[];
  className?: string;
}) {
  if (!artifacts?.length) return null;
  return (
    <div className={"artifacts " + className}>
      {artifacts.map((a) => {
        const ic = glyph(a);
        return isInternalRoute(a) ? (
          <Link key={a.href + a.label} to={a.href} className="artifact">
            {a.label}
            <span className="artifact-ic" aria-hidden="true">
              {ic}
            </span>
          </Link>
        ) : (
          <a
            key={a.href + a.label}
            href={a.href}
            target="_blank"
            rel="noreferrer noopener"
            className="artifact"
          >
            {a.label}
            <span className="artifact-ic" aria-hidden="true">
              {ic}
            </span>
          </a>
        );
      })}
    </div>
  );
}
