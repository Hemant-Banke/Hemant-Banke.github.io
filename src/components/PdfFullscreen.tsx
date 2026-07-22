import { useCallback, useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist";
import AsciiField from "./AsciiField";

// PDF.js runs its parser in a worker; point it at the bundled worker asset.
pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

const MIN_ZOOM = 0.4;
const MAX_ZOOM = 6;
const clampZoom = (z: number) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z));

/**
 * Full-screen PDF reader: a top action bar (zoom / fit / page / open / close)
 * over a scrollable document, with the ASCII field filling the letterbox space.
 *
 * Zoom is decoupled from rendering: each page is rasterised once at a fixed
 * high-quality scale (fit-width × QUALITY × dpr), and the zoom control just
 * applies the CSS `zoom` property to the page column. That makes zooming smooth
 * and flicker-free (no re-render, no scroll jumps) while staying crisp up to
 * ~QUALITY×. Esc closes it.
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
  const layerRef = useRef<HTMLDivElement>(null); // GPU transform preview during gestures
  const docRef = useRef<PDFDocumentProxy | null>(null);
  const renderToken = useRef(0);
  const tasks = useRef<RenderTask[]>([]);
  const naturalWidth = useRef(0);
  const fitScale = useRef(1); // pdf.js scale at which a page fits the column
  const zoomRef = useRef(1); // latest zoom (for gesture math without re-subscribing)

  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1);

  // Always use the PDF's real filename (basename of the URL). Split off a short
  // tail so it middle-ellipsises (…) instead of hiding when the bar is tight.
  const name = decodeURIComponent(
    url.split(/[?#]/)[0].split("/").pop() || downloadName,
  );
  const TAIL = 8;
  const nameHead = name.length > TAIL ? name.slice(0, -TAIL) : "";
  const nameTail = name.length > TAIL ? name.slice(-TAIL) : name;

  const cancelRenders = () => {
    tasks.current.forEach((t) => t.cancel());
    tasks.current = [];
  };

  const computeFit = () => {
    const avail = Math.min((scrollRef.current?.clientWidth ?? 900) - 48, 900);
    return naturalWidth.current ? avail / naturalWidth.current : 1;
  };

  // Set the CSS zoom to `target`, keeping the content point under (clientX,
  // clientY) fixed — i.e. zoom toward the cursor / pinch midpoint. We anchor
  // against the pages element's *actual* rects: record where the cursor sits as
  // a fraction of the pages box, apply the zoom, then nudge scroll so that same
  // fraction lands back under the cursor. Reading real geometry keeps it correct
  // regardless of the scroller's padding and the column's horizontal centering
  // (the earlier closed-form math ignored the padding and drifted diagonally).
  const applyZoom = useCallback((target: number, clientX: number, clientY: number) => {
    const scroller = scrollRef.current;
    const pages = pagesRef.current;
    if (!scroller || !pages) return;
    const z1 = clampZoom(target);
    const z0 = zoomRef.current;
    if (z1 === z0) return;
    const before = pages.getBoundingClientRect();
    const fx = before.width ? (clientX - before.left) / before.width : 0;
    const fy = before.height ? (clientY - before.top) / before.height : 0;
    pages.style.setProperty("zoom", String(z1));
    zoomRef.current = z1;
    const after = pages.getBoundingClientRect(); // reflects the new zoom
    scroller.scrollLeft += after.left + fx * after.width - clientX;
    scroller.scrollTop += after.top + fy * after.height - clientY;
  }, []);

  // Rasterise every page once at fit-width × QUALITY (× dpr). Not called on
  // zoom — only on load and on container resize.
  const render = useCallback(async () => {
    const doc = docRef.current;
    const container = pagesRef.current;
    if (!doc || !container) return;
    const token = ++renderToken.current;
    cancelRenders();
    // Render crisp for the device pixel ratio, with extra `quality` headroom so
    // CSS zoom stays sharp when you pinch in. Dialled back for long docs to bound
    // the up-front memory/CPU.
    //
    // Phones (coarse pointer) keep the full-resolution path: pages are physically
    // small, screens are high-DPI, and the total cost is modest. On laptops and
    // larger the page is much wider, so a 5–6× oversample (fit × quality × dpr)
    // produced enormous canvases per page and made the viewer sluggish — cap the
    // oversample there for fast rendering that's still crisp at fit width.
    const many = doc.numPages > 12;
    const coarse =
      typeof matchMedia !== "undefined" && matchMedia("(pointer: coarse)").matches;
    const dpr = coarse
      ? Math.min(window.devicePixelRatio || 1, many ? 2 : 3)
      : Math.min(window.devicePixelRatio || 1, 2);
    const quality = coarse ? (many ? 1.5 : 2.5) : many ? 1.1 : 1.5;
    const renderScale = fitScale.current * quality;
    container.innerHTML = "";
    for (let p = 1; p <= doc.numPages; p++) {
      if (token !== renderToken.current) return;
      const pg = await doc.getPage(p);
      const vp = pg.getViewport({ scale: renderScale });
      const dispW = Math.floor(vp.width / quality);
      const dispH = Math.floor(vp.height / quality);

      const wrap = document.createElement("div");
      wrap.className = "pdf-page-wrap";
      wrap.style.width = `${dispW}px`;
      wrap.style.height = `${dispH}px`;
      const canvas = document.createElement("canvas");
      canvas.className = "pdf-page";
      canvas.width = Math.floor(vp.width * dpr);
      canvas.height = Math.floor(vp.height * dpr);
      canvas.style.width = `${dispW}px`;
      canvas.style.height = `${dispH}px`;
      const ctx = canvas.getContext("2d")!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      wrap.appendChild(canvas);
      container.appendChild(wrap);

      // Clickable link layer (external URLs → new tab). Rects are in render-scale
      // space, so divide by `quality` to land on the displayed size.
      try {
        const annots = await pg.getAnnotations({ intent: "display" });
        for (const a of annots) {
          if (a.subtype !== "Link" || !a.url) continue;
          const r = vp.convertToViewportRectangle(a.rect);
          const link = document.createElement("a");
          link.className = "pdf-link";
          link.href = a.url;
          link.target = "_blank";
          link.rel = "noreferrer noopener";
          link.style.left = `${Math.min(r[0], r[2]) / quality}px`;
          link.style.top = `${Math.min(r[1], r[3]) / quality}px`;
          link.style.width = `${Math.abs(r[2] - r[0]) / quality}px`;
          link.style.height = `${Math.abs(r[3] - r[1]) / quality}px`;
          wrap.appendChild(link);
        }
      } catch {
        /* annotations are optional */
      }

      const task = pg.render({ canvasContext: ctx, viewport: vp });
      tasks.current.push(task);
      try {
        await task.promise;
      } catch {
        /* cancelled on re-render/unmount */
      }
    }
  }, []);

  // Load the document + compute the fit scale, then render once.
  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setZoom(1);
    zoomRef.current = 1;
    const task = pdfjsLib.getDocument({ url });
    task.promise
      .then(async (doc) => {
        if (cancelled) return;
        docRef.current = doc;
        setNumPages(doc.numPages);
        const first = await doc.getPage(1);
        naturalWidth.current = first.getViewport({ scale: 1 }).width;
        fitScale.current = computeFit();
        setStatus("ready");
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
    if (status === "ready") render();
  }, [status, render]);

  // Re-fit + re-render on container resize (rotation, window resize) — debounced.
  useEffect(() => {
    let t = 0;
    const onResize = () => {
      window.clearTimeout(t);
      t = window.setTimeout(() => {
        if (!naturalWidth.current) return;
        fitScale.current = computeFit();
        render();
      }, 150);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.clearTimeout(t);
    };
  }, [render]);

  // Apply the initial zoom once the pages exist.
  useEffect(() => {
    if (status === "ready") pagesRef.current?.style.setProperty("zoom", String(zoomRef.current));
  }, [status]);

  // Esc to close; lock body scroll while the overlay is open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
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

  // Pinch (touch) and ctrl-wheel (trackpad) zoom. While the gesture is live we
  // preview with a cheap GPU `transform: scale()` on the zoom layer (no relayout
  // → smooth), and only commit the real CSS zoom (+ scroll re-anchor) when it
  // ends. Committing zooms toward the gesture anchor (midpoint / cursor).
  useEffect(() => {
    const scroller = scrollRef.current;
    const layer = layerRef.current;
    if (!scroller || !layer) return;
    let pinching = false;
    let startDist = 0;
    let commitZoom = 1;
    let liveTarget = 1;
    let anchorX = 0;
    let anchorY = 0;
    let wheelTimer = 0;
    const dist = (t: TouchList) =>
      Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);

    const beginPreview = (clientX: number, clientY: number) => {
      commitZoom = zoomRef.current;
      liveTarget = commitZoom;
      anchorX = clientX;
      anchorY = clientY;
      const rect = layer.getBoundingClientRect();
      layer.style.transformOrigin = `${clientX - rect.left}px ${clientY - rect.top}px`;
    };
    const preview = (target: number) => {
      liveTarget = clampZoom(target);
      layer.style.transform = `scale(${liveTarget / commitZoom})`;
    };
    const commit = () => {
      layer.style.transform = "";
      layer.style.transformOrigin = "";
      applyZoom(liveTarget, anchorX, anchorY); // sets real zoom + re-anchors scroll
      setZoom(zoomRef.current);
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 2) return;
      pinching = true;
      startDist = dist(e.touches);
      beginPreview(
        (e.touches[0].clientX + e.touches[1].clientX) / 2,
        (e.touches[0].clientY + e.touches[1].clientY) / 2,
      );
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!pinching || e.touches.length !== 2) return;
      e.preventDefault(); // suppress native scroll/zoom mid-pinch
      preview(commitZoom * (dist(e.touches) / (startDist || 1)));
    };
    const onTouchEnd = () => {
      if (!pinching) return;
      pinching = false;
      commit();
    };
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return; // plain scroll passes through; ctrl = trackpad pinch
      e.preventDefault();
      if (pinching) return;
      if (!wheelTimer) beginPreview(e.clientX, e.clientY);
      preview(liveTarget * Math.exp(-e.deltaY * 0.01));
      window.clearTimeout(wheelTimer);
      wheelTimer = window.setTimeout(() => {
        wheelTimer = 0;
        commit();
      }, 150);
    };

    scroller.addEventListener("touchstart", onTouchStart, { passive: false });
    scroller.addEventListener("touchmove", onTouchMove, { passive: false });
    scroller.addEventListener("touchend", onTouchEnd);
    scroller.addEventListener("touchcancel", onTouchEnd);
    scroller.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      scroller.removeEventListener("touchstart", onTouchStart);
      scroller.removeEventListener("touchmove", onTouchMove);
      scroller.removeEventListener("touchend", onTouchEnd);
      scroller.removeEventListener("touchcancel", onTouchEnd);
      scroller.removeEventListener("wheel", onWheel);
      window.clearTimeout(wheelTimer);
    };
  }, [applyZoom]);

  // Which page is under the viewport middle (robust to CSS zoom via rects).
  const onScroll = () => {
    const scroller = scrollRef.current;
    const container = pagesRef.current;
    if (!scroller || !container) return;
    const mid = scroller.getBoundingClientRect().top + scroller.clientHeight / 2;
    const kids = container.children;
    for (let i = 0; i < kids.length; i++) {
      if (mid < (kids[i] as HTMLElement).getBoundingClientRect().bottom) {
        setPage(i + 1);
        return;
      }
    }
    if (kids.length) setPage(kids.length);
  };

  const zoomBy = (factor: number) => {
    const s = scrollRef.current;
    if (!s) return;
    const r = s.getBoundingClientRect();
    applyZoom(zoomRef.current * factor, r.left + r.width / 2, r.top + r.height / 2);
    setZoom(zoomRef.current);
  };
  const resetFit = () => {
    pagesRef.current?.style.setProperty("zoom", "1");
    zoomRef.current = 1;
    setZoom(1);
    scrollRef.current?.scrollTo({ top: 0, left: 0 });
  };

  // Download: force a real download on desktop; on touch devices (where the
  // download attribute is usually ignored and the file just opens inline), open
  // it in a new tab so the app isn't replaced.
  const download = async () => {
    const coarse =
      typeof matchMedia !== "undefined" && matchMedia("(pointer: coarse)").matches;
    if (coarse) {
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("fetch failed");
      const blob = await res.blob();
      const obj = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = obj;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(obj), 2000);
    } catch {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="pdffs" role="dialog" aria-modal="true" aria-label="resume PDF">
      <AsciiField />

      <div className="pdffs-bar">
        <div className="pdffs-title">
          <span className="accent-green">▤</span>
          <span className="pdffs-fname" title={name}>
            <span className="fname-head">{nameHead}</span>
            <span className="fname-tail">{nameTail}</span>
          </span>
          {status === "ready" && (
            <span className="pdffs-pageinfo dim">
              · pg <span className="accent-cyan">{page}</span>/{numPages}
            </span>
          )}
        </div>
        <div className="pdffs-actions">
          <button className="btn pdf-btn" onClick={() => zoomBy(0.8)} aria-label="zoom out">
            −
          </button>
          <span className="pdf-scale">{Math.round(zoom * 100)}%</span>
          <button className="btn pdf-btn" onClick={() => zoomBy(1.25)} aria-label="zoom in">
            +
          </button>
          <button className="btn pdf-btn" onClick={resetFit} aria-label="fit to width">
            ⇥<span className="btn-label"> fit</span>
          </button>
          <button className="btn pdf-btn" onClick={download} aria-label="download">
            ↓<span className="btn-label"> download</span>
          </button>
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
            decoding {name}
            <span className="blink">█</span>
          </div>
        )}
        {status === "error" && (
          <div className="pdf-status">
            <p className="accent-amber">! could not load {name}</p>
            <p className="dim">
              Retry, or{" "}
              <a href={url} target="_blank" rel="noreferrer noopener">
                open it
              </a>
              .
            </p>
          </div>
        )}
        <div className="pdf-zoomlayer" ref={layerRef} hidden={status !== "ready"}>
          <div className="pdffs-pages" ref={pagesRef} />
        </div>
      </div>
    </div>
  );
}
