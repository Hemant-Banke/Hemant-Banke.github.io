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
 * Each page is rasterised once, at a fixed high-quality scale. Zoom afterwards
 * is the CSS `zoom` property on the page column — one mechanism for buttons,
 * wheel and pinch alike, and (unlike `transform: scale()`) a genuine layout
 * property, so the scroller's scrollable range is always unambiguous, real
 * layout in every engine — nothing for a browser to infer or disagree about.
 *
 * The anchor-under-cursor math is pure arithmetic from geometry cached once
 * per render (`measureZoomGeometry`), not a live re-measurement of the zoomed
 * element after each zoom step. `.pdffs-pages`'s own top-left position is a
 * layout fact set entirely by its (unzoomed) parent's padding — zoom scales
 * its *content*, never its own anchor point, exactly like a `transform-origin:
 * 0 0` scale — so that position is safe to cache and reuse at any zoom level.
 * Never reading the zoomed element's rect back out right after mutating its
 * `zoom` avoids depending on a browser committing that update synchronously.
 * Esc closes it.
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
  const fitScale = useRef(1); // pdf.js scale at which a page fits the column
  const zoomRef = useRef(1); // latest zoom (for gesture math without re-subscribing)
  // Fixed layout geometry for the zoom-anchor math, measured once per render
  // (initial load and window-resize refits), not per zoom step.
  // scrollerLeft/Top: the scroller's own screen position (stable — `.pdffs`
  // is position:fixed over the whole viewport). layerOriginX/Y: the page
  // column's own top-left, in the scroller's content-space — fixed by its
  // parent's padding, independent of the column's own zoom (see the
  // top-of-file note), so it's valid at any zoom level once measured.
  const scrollerLeft = useRef(0);
  const scrollerTop = useRef(0);
  const layerOriginX = useRef(0);
  const layerOriginY = useRef(0);

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

  // Re-measures the fixed layout geometry the zoom math depends on. Called
  // once after layout is stable (end of `render()`), not per zoom step —
  // see the top-of-file note on why layerOriginX/Y hold at any zoom level.
  const measureZoomGeometry = () => {
    const scroller = scrollRef.current;
    const pages = pagesRef.current;
    if (!scroller || !pages) return;
    const scrollerRect = scroller.getBoundingClientRect();
    const pagesRect = pages.getBoundingClientRect();
    scrollerLeft.current = scrollerRect.left;
    scrollerTop.current = scrollerRect.top;
    layerOriginX.current = scroller.scrollLeft + (pagesRect.left - scrollerRect.left);
    layerOriginY.current = scroller.scrollTop + (pagesRect.top - scrollerRect.top);
  };

  // Zoom to `target`, keeping the content point under (clientX, clientY)
  // fixed — i.e. zoom toward the cursor / pinch midpoint. Entirely arithmetic
  // from the cached geometry above plus cheap scrollLeft/Top reads: convert
  // the cursor's screen position to a position within the scrollable
  // *content*, subtract the page column's fixed content-space offset to get
  // a local coordinate in its own unzoomed space, rescale that local point,
  // then solve for the scrollLeft/Top that puts it back under the cursor.
  // Deliberately never reads the page column's own rect back out after
  // setting `zoom` on it — see the top-of-file note.
  const applyZoom = useCallback((target: number, clientX: number, clientY: number) => {
    const scroller = scrollRef.current;
    const pages = pagesRef.current;
    if (!scroller || !pages) return;
    const z1 = clampZoom(target);
    const z0 = zoomRef.current;
    if (z1 === z0) return;
    const cursorInScrollerX = clientX - scrollerLeft.current;
    const cursorInScrollerY = clientY - scrollerTop.current;
    const contentX = scroller.scrollLeft + cursorInScrollerX;
    const contentY = scroller.scrollTop + cursorInScrollerY;
    const localX = (contentX - layerOriginX.current) / z0;
    const localY = (contentY - layerOriginY.current) / z0;
    pages.style.setProperty("zoom", String(z1));
    zoomRef.current = z1;
    const newContentX = layerOriginX.current + localX * z1;
    const newContentY = layerOriginY.current + localY * z1;
    scroller.scrollLeft = newContentX - cursorInScrollerX;
    scroller.scrollTop = newContentY - cursorInScrollerY;
  }, []);

  // Rasterise every page once at fit-width × quality × dpr. Not called on
  // zoom — only on load and on container resize.
  const render = useCallback(async () => {
    const doc = docRef.current;
    const container = pagesRef.current;
    if (!doc || !container) return;
    const token = ++renderToken.current;
    cancelRenders();
    // Oversample beyond 1:1 so zooming in stays crisp; dialled back for very
    // long documents to bound the up-front memory/CPU.
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const quality = doc.numPages > 12 ? 1.3 : 2;
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
    if (token !== renderToken.current) return;
    // Layout is stable now (all pages exist at their final size) — refresh
    // the geometry applyZoom depends on. Covers both the initial load and a
    // window-resize refit in one place.
    measureZoomGeometry();
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

  // Pinch (touch) and ctrl-wheel (trackpad) zoom. `zoom` is a real layout
  // property (unlike a compositor transform), so each `applyZoom` call forces
  // a reflow — coalesce to at most one per animation frame rather than
  // running it on every raw touchmove/wheel tick.
  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;
    let pinching = false;
    let startDist = 0;
    let gestureZoom = 1; // zoomRef.current as of gesture start
    let raf = 0;
    let pending: { target: number; x: number; y: number } | null = null;
    let wheelTimer = 0;
    const dist = (t: TouchList) =>
      Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);

    const flush = () => {
      raf = 0;
      if (!pending) return;
      const { target, x, y } = pending;
      pending = null;
      applyZoom(target, x, y);
    };
    const queue = (target: number, x: number, y: number) => {
      pending = { target, x, y };
      if (!raf) raf = requestAnimationFrame(flush);
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 2) return;
      pinching = true;
      startDist = dist(e.touches);
      gestureZoom = zoomRef.current;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!pinching || e.touches.length !== 2) return;
      e.preventDefault(); // suppress native scroll/zoom mid-pinch
      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      queue(gestureZoom * (dist(e.touches) / (startDist || 1)), midX, midY);
    };
    const onTouchEnd = () => {
      if (!pinching) return;
      pinching = false;
      setZoom(zoomRef.current);
    };
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return; // plain scroll passes through; ctrl = trackpad pinch
      e.preventDefault();
      if (pinching) return;
      queue(zoomRef.current * Math.exp(-e.deltaY * 0.01), e.clientX, e.clientY);
      window.clearTimeout(wheelTimer);
      wheelTimer = window.setTimeout(() => {
        wheelTimer = 0;
        setZoom(zoomRef.current);
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
      if (raf) cancelAnimationFrame(raf);
      window.clearTimeout(wheelTimer);
    };
  }, [applyZoom]);

  // Which page is under the viewport middle.
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
        <div className="pdffs-pages" ref={pagesRef} hidden={status !== "ready"} />
      </div>
    </div>
  );
}
