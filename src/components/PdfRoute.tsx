import { lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";

// pdfjs is heavy — keep it in its own chunk, only fetched when a PDF opens.
const PdfFullscreen = lazy(() => import("./PdfFullscreen"));

/**
 * Renders the full-screen PDF viewer as a route's content (used for pdf-only
 * pages). Closing goes back if there's history, otherwise to `fallbackTo`.
 */
export default function PdfRoute({
  url,
  downloadName,
  fallbackTo = "/digital-garden",
}: {
  url: string;
  downloadName?: string;
  fallbackTo?: string;
}) {
  const navigate = useNavigate();
  const close = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate(fallbackTo);
  };
  return (
    <Suspense fallback={null}>
      <PdfFullscreen url={url} downloadName={downloadName} onClose={close} />
    </Suspense>
  );
}
