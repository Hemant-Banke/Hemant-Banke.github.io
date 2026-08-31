import { lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import ErrorBoundary from "./ErrorBoundary";

// pdfjs is heavy — keep it in its own chunk, only fetched when a PDF opens.
//
// A stale cached bundle from *before* a redeploy can reference a chunk
// filename (content-hashed) that the *current* deploy no longer has —
// "Importing a module script failed" / a 404 on PdfFullscreen-*.js. GitHub
// Pages' CDN can take a while to fully converge after a deploy, so a visitor
// can transiently land on a mismatched index.html + chunk pairing. The fix is
// a self-healing reload: on the first such failure this session, do one full
// page reload to fetch the current (consistent) asset manifest.
const RELOAD_FLAG = "pdf-chunk-reload";
const PdfFullscreen = lazy(() =>
  import("./PdfFullscreen")
    .then((mod) => {
      try {
        sessionStorage.removeItem(RELOAD_FLAG);
      } catch {
        // ignore (private browsing / storage disabled)
      }
      return mod;
    })
    .catch((err) => {
      try {
        if (!sessionStorage.getItem(RELOAD_FLAG)) {
          sessionStorage.setItem(RELOAD_FLAG, "1");
          window.location.reload();
          // reload is in flight; nothing else here will actually run/render
          return new Promise<never>(() => {});
        }
      } catch {
        // storage unavailable — fall through to the error boundary below
      }
      throw err;
    }),
);

function PdfErrorFallback({ onClose }: { onClose: () => void }) {
  return (
    <div className="page layout">
      <div className="section-head">
        <h1>
          <span className="path">pdf</span>
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
