import { useNavigate } from "react-router-dom";

/**
 * Renders a note's compiled HTML and intercepts clicks on internal wiki-links
 * so they navigate client-side instead of triggering a full page load.
 */
export default function NoteBody({ html }: { html: string }) {
  const navigate = useNavigate();
  const onClick: React.MouseEventHandler = (e) => {
    const a = (e.target as HTMLElement).closest("a[data-internal]");
    if (a) {
      e.preventDefault();
      const target = a.getAttribute("data-slug");
      if (target) navigate(`/digital-garden/${target}`);
    }
  };
  return (
    <div
      className="note-body"
      onClick={onClick}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
