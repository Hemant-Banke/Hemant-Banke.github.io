import { Link } from "react-router-dom";
import { getNote } from "../content/manifest";

// Tiny inline formatter for free-text fields in src/data/site.ts — not a full
// markdown parser, just the handful of things a bio/intro string needs:
// **bold**, *italic*, __underline__, [[wiki-links]], and literal "\n" newlines.
// Output is plain React elements (no dangerouslySetInnerHTML).
//
// Wiki-links take the same shape as the garden's: [[slug]] renders the note's
// title, [[slug|label]] renders your own text. A target that doesn't resolve
// falls back to plain amber text rather than a dead link, matching how the
// garden marks broken links.
const TOKEN = /(\*\*.+?\*\*|\*.+?\*|__.+?__|\[\[[^\]\n]+\]\]|\n)/g;

function WikiLink({ raw }: { raw: string }) {
  const [target, alias] = raw.slice(2, -2).split("|");
  const slug = target.trim();
  const note = getNote(slug);
  const label = (alias ?? (note ? note.title : slug)).trim();
  if (!note) {
    return (
      <span className="wikilink broken" title={`unresolved link: ${slug}`}>
        {label}
      </span>
    );
  }
  return (
    <Link className="wikilink" to={`/digital-garden/${note.slug}`}>
      {label}
    </Link>
  );
}

export default function Formatted({ text }: { text: string }) {
  return (
    <>
      {text
        .split(TOKEN)
        .filter((part) => part !== "")
        .map((part, i) => {
          if (part === "\n") return <br key={i} />;
          if (part.startsWith("[[") && part.endsWith("]]")) {
            return <WikiLink key={i} raw={part} />;
          }
          if (part.startsWith("**") && part.endsWith("**")) {
            return <strong key={i}>{part.slice(2, -2)}</strong>;
          }
          if (part.startsWith("__") && part.endsWith("__")) {
            return <u key={i}>{part.slice(2, -2)}</u>;
          }
          if (part.startsWith("*") && part.endsWith("*")) {
            return <em key={i}>{part.slice(1, -1)}</em>;
          }
          return part;
        })}
    </>
  );
}
