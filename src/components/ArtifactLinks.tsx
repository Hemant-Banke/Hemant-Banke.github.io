import { Link } from "react-router-dom";
import type { Artifact } from "../content/types";

// Pick a glyph by link type: download for pdfs, internal arrow for in-site
// routes, external arrow otherwise.
function glyph(a: Artifact): string {
  if (a.href.toLowerCase().endsWith(".pdf")) return "↓";
  if (a.href.startsWith("/")) return "→";
  return "↗";
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
        return a.href.startsWith("/") ? (
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
