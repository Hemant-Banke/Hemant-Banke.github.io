import { useCallback, useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist";
import AsciiField from "./AsciiField";

// PDF.js runs its parser in a worker; point it at the bundled worker asset.
pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

const MIN_SCALE = 0.35;
const MAX_SCALE = 4;

/**
 * Full-screen PDF reader: a top action bar (zoom / fit / page / download /
 * close) over a scrollable document, with the ASCII plasma field filling the
 * letterbox space around the page. Esc closes it.
 */
export default function PdfFullscreen({
  url,
  downloadName = "resume.pdf",
  onClose,
}: {
  url: string;
  downloadName?: string;
  onClose: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const pagesRef = useRef<HTMLDivElement>(null);
  const docRef = useRef<PDFDocumentProxy | null>(null);
  const renderToken = useRef(0);
  const tasks = useRef<RenderTask[]>([]);
  const naturalWidth = useRef(0);

  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(1);
  const [scale, setScale] = useState(1);

  const cancelRenders = () => {
    tasks.current.forEach((t) => t.cancel());
    tasks.current = [];
  };

  const renderAll = useCallback(async (s: number) => {
    const doc = docRef.current;
    const container = pagesRef.current;
    if (!doc || !container) return;
    const token = ++renderToken.current;
    cancelRenders();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    container.innerHTML = "";
    for (let p = 1; p <= doc.numPages; p++) {
      if (token !== renderToken.current) return;
      const pg = await doc.getPage(p);
      const viewport = pg.getViewport({ scale: s });
      const canvas = document.createElement("canvas");
      canvas.className = "pdf-page";
      canvas.width = Math.floor(viewport.width * dpr);
      canvas.height = Math.floor(viewport.height * dpr);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;
      const ctx = canvas.getContext("2d")!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      container.appendChild(canvas);
      const task = pg.render({ canvasContext: ctx, viewport });
      tasks.current.push(task);
      try {
        await task.promise;
      } catch {
        /* cancelled on re-render/unmount */
      }
    }
  }, []);

  // Load the document + compute an initial fit-to-width scale.
  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    const task = pdfjsLib.getDocument({ url });
    task.promise
      .then(async (doc) => {
        if (cancelled) return;
        docRef.current = doc;
        setNumPages(doc.numPages);
        const first = await doc.getPage(1);
        naturalWidth.current = first.getViewport({ scale: 1 }).width;
        const avail = Math.min((scrollRef.current?.clientWidth ?? 900) - 48, 900);
        const fit = Math.max(
          MIN_SCALE,
          Math.min(MAX_SCALE, avail / naturalWidth.current),
        );
        setStatus("ready");
        setScale(fit);
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
      cancelRenders();
      task.destroy();
      docRef.current?.destroy();
      docRef.current = null;
    };
  }, [url]);

  useEffect(() => {
    if (status === "ready") renderAll(scale);
  }, [status, scale, renderAll]);

  // Esc to close; lock body scroll while the overlay is open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    // Lock both <html> and <body>; the page scrolls on <html> in most browsers.
    const html = document.documentElement;
    const prevHtml = html.style.overflow;
    const prevBody = document.body.style.overflow;
    html.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      html.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
    };
  }, [onClose]);

  const onScroll = () => {
    const container = pagesRef.current;
    const scroller = scrollRef.current;
    if (!container || !scroller) return;
    const mid = scroller.scrollTop + scroller.clientHeight / 2;
    let acc = 0;
    const kids = container.children;
    for (let i = 0; i < kids.length; i++) {
      acc += (kids[i] as HTMLElement).offsetHeight + 24;
      if (mid < acc) {
        setPage(i + 1);
        return;
      }
    }
  };

  const zoom = (factor: number) =>
    setScale((s) => Math.max(MIN_SCALE, Math.min(MAX_SCALE, s * factor)));
  const fitWidth = () => {
    const avail = Math.min((scrollRef.current?.clientWidth ?? 900) - 48, 900);
    if (naturalWidth.current)
      setScale(
        Math.max(MIN_SCALE, Math.min(MAX_SCALE, avail / naturalWidth.current)),
      );
  };

  return (
    <div className="pdffs" role="dialog" aria-modal="true" aria-label="resume PDF">
      <AsciiField />

      <div className="pdffs-bar">
        <div className="pdffs-title">
          <span className="accent-green">▤</span>{" "}
          <span className="pdffs-fname">{downloadName}</span>
          {status === "ready" && (
            <span className="pdffs-pageinfo dim">
              <span className="pdffs-fname"> · </span>pg{" "}
              <span className="accent-cyan">{page}</span>/{numPages}
            </span>
          )}
        </div>
        <div className="pdffs-actions">
          <button className="btn pdf-btn" onClick={() => zoom(0.8)} aria-label="zoom out">
            −
          </button>
          <span className="pdf-scale">{Math.round(scale * 100)}%</span>
          <button className="btn pdf-btn" onClick={() => zoom(1.25)} aria-label="zoom in">
            +
          </button>
          <button className="btn pdf-btn" onClick={fitWidth} aria-label="fit to width">
            ⇥<span className="btn-label"> fit</span>
          </button>
          <a
            className="btn pdf-btn"
            href={url}
            download={downloadName}
            aria-label="download"
          >
            ↓<span className="btn-label"> download</span>
          </a>
          <button
            className="btn pdf-btn pdffs-close"
            onClick={onClose}
            aria-label="close"
          >
            ✕<span className="btn-label"> esc</span>
          </button>
        </div>
      </div>

      <div className="pdffs-scroll" ref={scrollRef} onScroll={onScroll}>
        {status === "loading" && (
          <div className="pdf-status dim">
            <span className="prompt" />
            decoding {downloadName}
            <span className="blink">█</span>
          </div>
        )}
        {status === "error" && (
          <div className="pdf-status">
            <p className="accent-amber">! could not load {downloadName}</p>
            <p className="dim">
              Retry, or{" "}
              <a href={url} download={downloadName}>
                download it
              </a>
              .
            </p>
          </div>
        )}
        <div className="pdffs-pages" ref={pagesRef} hidden={status !== "ready"} />
      </div>
    </div>
  );
}
