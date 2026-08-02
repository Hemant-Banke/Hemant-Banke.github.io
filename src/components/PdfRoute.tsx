import { lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import ErrorBoundary from "./ErrorBoundary";

// pdfjs is heavy — keep it in its own chunk, only fetched when a PDF opens.
const PdfFullscreen = lazy(() => import("./PdfFullscreen"));

function PdfErrorFallback({ onClose }: { onClose: () => void }) {
  return (
    <div className="page layout">
      <div className="section-head">
        <span className="hash">##</span>
        <h1>
          <span className="path">~/pdf</span>
        </h1>
      </div>
      <p className="lead dim">
        ! the PDF viewer hit an error in this browser. Check the console for
        details, or try again.
      </p>
      <button className="btn" onClick={onClose}>
        ‹ back
      </button>
    </div>
  );
}

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
    <ErrorBoundary fallback={<PdfErrorFallback onClose={close} />}>
      <Suspense fallback={null}>
        <PdfFullscreen url={url} downloadName={downloadName} onClose={close} />
      </Suspense>
    </ErrorBoundary>
  );
}
