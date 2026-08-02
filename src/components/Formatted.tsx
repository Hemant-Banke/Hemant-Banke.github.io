// Tiny inline formatter for free-text fields in src/data/site.ts — not a full
// markdown parser, just the handful of things a bio/intro string needs:
// **bold**, *italic*, __underline__, and literal "\n" newlines. Output is
// plain React elements (no dangerouslySetInnerHTML) since these are simple
// inline marks, not structural markdown (lists, links, headings).
const TOKEN = /(\*\*.+?\*\*|\*.+?\*|__.+?__|\n)/g;

export default function Formatted({ text }: { text: string }) {
  return (
    <>
      {text
        .split(TOKEN)
        .filter((part) => part !== "")
        .map((part, i) => {
          if (part === "\n") return <br key={i} />;
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
