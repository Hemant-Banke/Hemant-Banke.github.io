import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { banner, widestLine } from "../lib/ascii";

// JetBrains Mono advances 0.6em per glyph; used to fit the banner to its box.
const CHAR_ADVANCE = 0.6;

/**
 * Renders `text` as a figlet ASCII banner sized to exactly fill its container
 * width (capped at `maxPx`), so it never overflows on narrow screens.
 */
export default function AsciiBanner({
  text,
  font,
  maxPx = 22,
  className,
}: {
  text: string;
  font?: string;
  maxPx?: number;
  className?: string;
}) {
  const art = useMemo(() => banner(text, font), [text, font]);
  const cols = useMemo(() => widestLine(art), [art]);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [fontPx, setFontPx] = useState(maxPx);

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const fit = () => {
      const w = el.clientWidth;
      if (!w || !cols) return;
      setFontPx(Math.max(2, Math.min(maxPx, (w * 0.98) / (cols * CHAR_ADVANCE))));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [cols, maxPx]);

  return (
    <div ref={wrapRef} className={className}>
      <pre className="wordmark" style={{ fontSize: `${fontPx}px` }} aria-label={text}>
        {art}
      </pre>
    </div>
  );
}
