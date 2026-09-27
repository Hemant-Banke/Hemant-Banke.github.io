import { type ReactNode, useEffect, useRef } from "react";
import { useHasHover, useReducedMotion, whileVisible } from "../lib/hooks";

// A night garden in ASCII for the footer. At rest it sits dim, almost part of
// the page; a soft lens follows the pointer and reveals it in full colour.
// Two copies of the scene are pre-rendered (dim + vivid) and the vivid one is
// composited through a radial mask each frame, so the per-frame cost is three
// drawImage calls plus a handful of animated glyphs (fireflies, a snail, an
// eye that watches the lens, a blinking prompt growing in the grass).
//
// On touch devices (no hover) the lens wanders on its own; with reduced
// motion nothing animates and the lens simply sits where you point.

const FONT_PX = 13;
const LINE = 15;

type Tone =
  | "fog"
  | "star"
  | "moon"
  | "grass"
  | "stem"
  | "leaf"
  | "magenta"
  | "amber"
  | "cyan"
  | "violet"
  | "ink";

interface Cell {
  ch: string;
  tone: Tone;
}

interface Sprite {
  lines: string[];
  // tone per character; falls back to `tone`
  tones?: Record<string, Tone>;
  tone: Tone;
}

// Seeded RNG so the garden grows the same way on every visit.
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

const MOON: Sprite = {
  lines: ["  .--.", ".'  .'", "/  /", "|  |", "\\   \\", " '.  '.", "   '--'"],
  tone: "moon",
};

const HEADS: Sprite[] = [
  { lines: [" .o. ", "o(@)o", " 'o' "], tone: "magenta", tones: { "@": "amber" } },
  { lines: [" _ _ ", "( V )", " \\_/ "], tone: "amber" },
  { lines: ["  *  ", " *@* ", "  *  "], tone: "cyan", tones: { "@": "amber" } },
  { lines: [" ,-. ", "(   )", " `v' "], tone: "violet" },
  { lines: ["\\ | /", " (o) "], tone: "amber", tones: { o: "magenta" } },
];

const MUSHROOM: Sprite = {
  lines: [" .-^-. ", "(o . o)", " `| |' "],
  tone: "magenta",
  tones: { "|": "ink", "`": "ink", "'": "ink" },
};

// The absurd ones.
const EYE: Sprite = { lines: [" .-. ", "(   )", " '-' "], tone: "ink" };
const WHY: Sprite = { lines: ["?"], tone: "violet" };
const PROMPT: Sprite = { lines: ["> "], tone: "grass" };
const SIGN: Sprite = {
  lines: ["+-----------+", "| elsewhere >", "+-----+-----+", "      |", "      |"],
  tone: "ink",
};

interface Scene {
  cols: number;
  rows: number;
  cells: (Cell | null)[];
  eye: { x: number; y: number } | null; // pixel centre of the eye
  cursor: { x: number; y: number } | null; // pixel pos of the prompt cursor
  groundY: number; // pixel y of the row the snail crawls on
}

function buildScene(cols: number, rows: number, cw: number): Scene {
  const rnd = mulberry32(20260927);
  const cells: (Cell | null)[] = new Array(cols * rows).fill(null);
  const put = (x: number, y: number, ch: string, tone: Tone) => {
    if (x < 0 || y < 0 || x >= cols || y >= rows) return;
    cells[y * cols + x] = ch === " " ? null : { ch, tone };
  };
  const ground = rows - 3;

  // Sky: sparse fog that thickens toward the horizon, plus stars.
  const meadowTop = Math.round(ground * 0.45);
  for (let y = 0; y < meadowTop; y++) {
    const t = y / meadowTop;
    for (let x = 0; x < cols; x++) {
      const r = rnd();
      if (r < 0.015 + 0.09 * t * t) put(x, y, r < 0.02 * t ? ":" : ".", "fog");
      else if (t < 0.7 && r > 0.994) put(x, y, rnd() < 0.3 ? "+" : rnd() < 0.5 ? "*" : "·", "star");
    }
  }

  // Meadow: Bayer-dithered grass that grows denser toward the ground, with
  // wildflowers scattered through it (they're what the lens finds).
  const blades = ["'`.,", "',;`\"", ";|/\\,", "|/\\|\\/;"];
  const wild: [string, Tone][] = [
    ["*", "amber"],
    ["o", "magenta"],
    ["*", "cyan"],
    ["@", "violet"],
    ["o", "amber"],
    ["+", "magenta"],
  ];
  for (let y = meadowTop; y < ground; y++) {
    const t = (y - meadowTop) / (ground - meadowTop);
    const density = 0.06 + 0.62 * Math.pow(t, 1.4);
    const set = blades[Math.min(blades.length - 1, Math.floor(t * blades.length))];
    for (let x = 0; x < cols; x++) {
      const th = (BAYER[y % 4][x % 4] + 0.5) / 16;
      if (th < density * (0.55 + 0.9 * rnd())) {
        if (rnd() < 0.035 + 0.05 * t) {
          const [ch, tone] = wild[(rnd() * wild.length) | 0];
          put(x, y, ch, tone);
        } else put(x, y, set[(rnd() * set.length) | 0], "grass");
      }
    }
  }

  // Ground: grass on the ground row, thinning soil below.
  const grass = ",.'`\"^;";
  for (let x = 0; x < cols; x++) {
    put(x, ground, rnd() < 0.8 ? grass[(rnd() * grass.length) | 0] : "_", "grass");
    for (let y = ground + 1; y < rows; y++) {
      const th = (BAYER[y % 4][x % 4] + 0.5) / 16;
      if (th < 0.45 - (y - ground) * 0.12) put(x, y, rnd() < 0.5 ? "." : ",", "grass");
    }
  }

  // Stamp a sprite with its last line resting on `baseY`, centred on `cx`.
  const stamp = (s: Sprite, cx: number, baseY: number) => {
    const w = Math.max(...s.lines.map((l) => l.length));
    const x0 = cx - Math.floor(w / 2);
    const y0 = baseY - s.lines.length + 1;
    // clear fog behind the sprite so it reads cleanly
    for (let y = y0; y <= baseY; y++)
      for (let x = x0; x < x0 + w; x++)
        if (y >= 0 && y < ground) cells[y * cols + x] = null;
    s.lines.forEach((line, dy) =>
      [...line].forEach((ch, dx) => {
        if (ch !== " ") put(x0 + dx, y0 + dy, ch, s.tones?.[ch] ?? s.tone);
      }),
    );
    return { x0, y0, w };
  };

  // A stem from the ground up to `topY` at column `cx`, with the odd leaf.
  const stem = (cx: number, topY: number) => {
    for (let y = ground - 1; y >= topY; y--) {
      put(cx, y, "|", "stem");
      if (rnd() < 0.22) put(cx - 1, y, "\\", "leaf");
      else if (rnd() < 0.22) put(cx + 1, y, "/", "leaf");
    }
  };

  // A flower: head sprite on a stem of random height.
  const flower = (head: Sprite, cx: number, stemLen: number) => {
    const headBase = ground - 1 - stemLen;
    stem(cx, headBase + 1);
    return stamp(head, cx, headBase);
  };

  // Moon, upper right.
  if (cols > 30) stamp(MOON, cols - 12, 1 + MOON.lines.length - 1);

  // Specials at fixed fractions of the width, flowers in between.
  const specials: { at: number; kind: "sign" | "eye" | "prompt" | "why" }[] = [
    { at: 0.1, kind: "sign" },
    { at: 0.38, kind: "eye" },
    { at: 0.64, kind: "prompt" },
    { at: 0.88, kind: "why" },
  ];
  const taken: [number, number][] = [];
  const free = (a: number, b: number) => taken.every(([l, r]) => b < l - 1 || a > r + 1);
  let eye: Scene["eye"] = null;
  let cursor: Scene["cursor"] = null;

  for (const sp of specials) {
    if (sp.kind === "sign" && cols < 70) continue;
    const cx = Math.round(sp.at * cols);
    if (sp.kind === "sign") {
      const r = stamp(SIGN, cx, ground - 1);
      taken.push([r.x0, r.x0 + r.w]);
    } else if (sp.kind === "eye") {
      const r = flower(EYE, cx, 5);
      taken.push([r.x0, r.x0 + r.w]);
      eye = { x: (cx + 0.5) * cw, y: (r.y0 + 1 + 0.5) * LINE };
    } else if (sp.kind === "prompt") {
      const r = flower(PROMPT, cx, 3);
      taken.push([r.x0, r.x0 + 3]);
      cursor = { x: (r.x0 + 2) * cw, y: r.y0 * LINE };
    } else {
      const r = flower(WHY, cx, 7);
      taken.push([r.x0, r.x0 + 1]);
    }
  }

  // Fill the rest with flowers and the odd mushroom.
  let x = 3;
  while (x < cols - 3) {
    const isShroom = rnd() < 0.14;
    const head = isShroom ? MUSHROOM : HEADS[(rnd() * HEADS.length) | 0];
    const w = Math.max(...head.lines.map((l) => l.length));
    const cx = x + Math.floor(w / 2);
    if (free(x, x + w)) {
      if (isShroom) stamp(head, cx, ground - 1);
      else flower(head, cx, 2 + ((rnd() * 8) | 0));
      taken.push([x, x + w]);
    }
    x += w + 1 + ((rnd() * 5) | 0);
  }

  return { cols, rows, cells, eye, cursor, groundY: (ground - 1) * LINE };
}

type Palette = Record<Tone, string>;

function readPalette(): Palette {
  const cs = getComputedStyle(document.documentElement);
  const v = (name: string) => cs.getPropertyValue(name).trim();
  return {
    fog: v("--dim"),
    star: v("--ink-strong"),
    moon: v("--amber"),
    grass: v("--green"),
    stem: v("--green"),
    leaf: v("--green"),
    magenta: v("--magenta"),
    amber: v("--amber"),
    cyan: v("--cyan"),
    violet: v("--violet"),
    ink: v("--ink"),
  };
}

export default function FooterGarden({ children }: { children?: ReactNode }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();
  const canHover = useHasHover();

  useEffect(() => {
    const wrap = wrapRef.current!;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const font = `${FONT_PX}px "JetBrains Mono", ui-monospace, monospace`;

    const dim = document.createElement("canvas");
    const vivid = document.createElement("canvas");
    const lens = document.createElement("canvas");

    let W = 0;
    let H = 0;
    let cw = 8;
    let R = 130; // lens radius, css px
    let scene: Scene | null = null;
    let pal = readPalette();
    const isLight = () => document.documentElement.dataset.theme === "light";

    // Fireflies: slow drifting points in the lower sky.
    const flies = Array.from({ length: 14 }, (_, i) => ({
      fx: 0.05 + ((i * 0.618) % 1) * 0.9,
      fy: 0.35 + ((i * 0.381) % 1) * 0.45,
      ph: i * 1.7,
      sp: 0.3 + ((i * 0.27) % 1) * 0.5,
    }));

    // Lens state (eased toward the target).
    const lensPos = { x: 0, y: 0 };
    let lensA = 0;
    let pointer: { x: number; y: number } | null = null;

    const renderLayer = (target: HTMLCanvasElement, alpha: number, fogAlpha: number) => {
      target.width = Math.floor(W * dpr);
      target.height = Math.floor(H * dpr);
      const c = target.getContext("2d")!;
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.font = font;
      c.textBaseline = "top";
      if (!scene) return;
      for (let y = 0; y < scene.rows; y++)
        for (let x = 0; x < scene.cols; x++) {
          const cell = scene.cells[y * scene.cols + x];
          if (!cell) continue;
          c.globalAlpha = cell.tone === "fog" ? fogAlpha : alpha;
          c.fillStyle = pal[cell.tone];
          c.fillText(cell.ch, x * cw, y * LINE);
        }
      c.globalAlpha = 1;
    };

    const rebuild = () => {
      W = Math.max(1, wrap.clientWidth);
      H = Math.max(1, wrap.clientHeight);
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = font;
      cw = ctx.measureText("M").width || 8;
      R = W < 640 ? 95 : 130;
      pal = readPalette();
      scene = buildScene(Math.ceil(W / cw), Math.floor(H / LINE), cw);
      const light = isLight();
      renderLayer(dim, light ? 0.3 : 0.2, light ? 0.22 : 0.16);
      renderLayer(vivid, 1, light ? 0.6 : 0.5);
      lens.width = Math.ceil(R * 2 * dpr);
      lens.height = Math.ceil(R * 2 * dpr);
      if (!lensA) {
        lensPos.x = W / 2;
        lensPos.y = H / 2;
      }
    };

    const glyph = (ch: string, x: number, y: number, color: string, a: number) => {
      ctx.globalAlpha = a;
      ctx.fillStyle = color;
      ctx.fillText(ch, x, y);
    };

    // How much of the lens covers pixel (x, y): 1 at the centre, 0 outside.
    const lit = (x: number, y: number) => {
      const d = Math.hypot(x - lensPos.x, y - lensPos.y) / R;
      return lensA * Math.max(0, Math.min(1, (1 - d) / 0.45));
    };

    const draw = (t: number) => {
      if (!scene) return;
      const light = isLight();
      const rest = light ? 0.3 : 0.2;
      ctx.clearRect(0, 0, W, H);
      ctx.globalAlpha = 1;
      ctx.drawImage(dim, 0, 0, W, H);

      // The lens: the vivid layer through a soft radial mask.
      if (lensA > 0.01) {
        const lc = lens.getContext("2d")!;
        const size = R * 2;
        lc.setTransform(dpr, 0, 0, dpr, 0, 0);
        lc.globalCompositeOperation = "source-over";
        lc.clearRect(0, 0, size, size);
        lc.drawImage(
          vivid,
          (lensPos.x - R) * dpr,
          (lensPos.y - R) * dpr,
          size * dpr,
          size * dpr,
          0,
          0,
          size,
          size,
        );
        lc.globalCompositeOperation = "destination-in";
        const g = lc.createRadialGradient(R, R, 0, R, R, R);
        g.addColorStop(0, `rgba(0,0,0,${lensA})`);
        g.addColorStop(0.55, `rgba(0,0,0,${lensA})`);
        g.addColorStop(1, "rgba(0,0,0,0)");
        lc.fillStyle = g;
        lc.fillRect(0, 0, size, size);
        // a faint green bloom under the revealed glyphs
        const glow = ctx.createRadialGradient(lensPos.x, lensPos.y, 0, lensPos.x, lensPos.y, R);
        glow.addColorStop(0, pal.grass);
        glow.addColorStop(1, "transparent");
        ctx.globalAlpha = lensA * (light ? 0.035 : 0.09);
        ctx.fillStyle = glow;
        ctx.fillRect(lensPos.x - R, lensPos.y - R, size, size);
        ctx.globalAlpha = 1;
        ctx.drawImage(lens, lensPos.x - R, lensPos.y - R, size, size);
      }

      // Fireflies: faintly visible at rest, glowing in the lens.
      for (const f of flies) {
        const x = (f.fx + 0.03 * Math.sin(t * 0.0004 * f.sp + f.ph)) * W;
        const y = (f.fy + 0.05 * Math.sin(t * 0.0003 * f.sp + f.ph * 2)) * H;
        const pulse = 0.55 + 0.45 * Math.sin(t * 0.002 * f.sp + f.ph);
        const l = lit(x, y);
        glyph("*", x, y, pal.amber, (rest + 0.15 + l * 0.7) * pulse);
      }

      // The snail, crossing the whole garden very slowly.
      const span = W + 60;
      const sx = ((t * 0.006) % span) - 30;
      const sl = lit(sx, scene.groundY);
      glyph("_@'", sx, scene.groundY, pal.violet, rest + 0.1 + sl * 0.7);

      // The eye watches the lens (or wanders when there's none).
      if (scene.eye) {
        const tx = lensA > 0.05 ? lensPos.x : scene.eye.x + 40 * Math.sin(t * 0.0007);
        const ty = lensA > 0.05 ? lensPos.y : scene.eye.y;
        const a = Math.atan2(ty - scene.eye.y, tx - scene.eye.x);
        const px = scene.eye.x + Math.cos(a) * cw * 0.7 - cw / 2;
        const py = scene.eye.y + Math.sin(a) * LINE * 0.18 - LINE / 2;
        glyph("•", px, py, pal.ink, rest + lit(scene.eye.x, scene.eye.y) * 0.8);
      }

      // A blinking prompt, growing in the grass.
      if (scene.cursor) {
        const on = reduced || Math.floor(t / 530) % 2 === 0;
        if (on) {
          const l = lit(scene.cursor.x, scene.cursor.y);
          glyph("█", scene.cursor.x, scene.cursor.y, pal.grass, rest + l * 0.8);
        }
      }
      ctx.globalAlpha = 1;
    };

    // ---- lens motion ----
    const step = (t: number) => {
      let target = pointer;
      let targetA = pointer ? 1 : 0;
      if (!pointer && !canHover) {
        // No hover on touch: let the lens wander so the garden still shows.
        target = {
          x: W * (0.5 + 0.4 * Math.sin(t * 0.00013)),
          y: H * (0.55 + 0.25 * Math.sin(t * 0.00021 + 1)),
        };
        targetA = 0.9;
      }
      if (target) {
        lensPos.x += (target.x - lensPos.x) * 0.16;
        lensPos.y += (target.y - lensPos.y) * 0.16;
      }
      lensA += (targetA - lensA) * 0.08;
    };

    let raf = 0;
    const loop = (t: number) => {
      step(t);
      draw(t);
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    // Reduced motion: a still scene; the lens jumps to wherever you point.
    const drawStill = () => {
      if (pointer) {
        lensPos.x = pointer.x;
        lensPos.y = pointer.y;
        lensA = 1;
      } else {
        lensA = 0;
      }
      draw(0);
    };

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      pointer = { x: e.clientX - r.left, y: e.clientY - r.top };
      if (reduced) drawStill();
    };
    const onLeave = () => {
      pointer = null;
      if (reduced) drawStill();
    };
    wrap.addEventListener("pointermove", onMove);
    wrap.addEventListener("pointerdown", onMove);
    wrap.addEventListener("pointerleave", onLeave);
    wrap.addEventListener("pointercancel", onLeave);

    const refresh = () => {
      rebuild();
      if (reduced) drawStill();
      else draw(performance.now());
    };
    refresh();
    // Glyph widths change once the webfont arrives.
    document.fonts?.ready.then(refresh);
    const ro = new ResizeObserver(refresh);
    ro.observe(wrap);
    window.addEventListener("themechange", refresh);

    const release = reduced ? () => {} : whileVisible(wrap, start, stop);

    return () => {
      release();
      stop();
      ro.disconnect();
      window.removeEventListener("themechange", refresh);
      wrap.removeEventListener("pointermove", onMove);
      wrap.removeEventListener("pointerdown", onMove);
      wrap.removeEventListener("pointerleave", onLeave);
      wrap.removeEventListener("pointercancel", onLeave);
    };
  }, [reduced, canHover]);

  return (
    <div className="footer-garden" ref={wrapRef}>
      <canvas ref={canvasRef} className="footer-garden-canvas" aria-hidden="true" />
      {children}
    </div>
  );
}
