import { useEffect, useRef } from "react";
import { useReducedMotion } from "../lib/hooks";

// Continuous-space cellular automaton in the Lenia family (SmoothLife rule,
// Rafler 2011). Each cell reads two smooth neighbourhood averages — an inner
// disc `m` (its own body) and an outer annulus `n` (its surroundings) — and a
// birth/survival transition nudges the field up or down. In the "glider"
// parameter regime the field self-organises from random noise into persistent
// blobs and gliders that drift, collide, split and merge. Rendered with the
// colormap from the original Lenia papers (sampled from the Lenia_icon4 image):
// value ramps dark-plum → purple → blue → cyan → green → yellow → orange → red.
//
// Performance: `m` and `n` are just disc averages, so each is computed with
// per-row horizontal prefix sums in O(radius) per cell instead of O(radius²).
// That ~doubles the affordable grid resolution — which is what makes it sharp.

// --- rule (glider regime: reliably makes moving structures, never flashes) ---
const RA = 14; // outer radius (kernel scale, sim cells)
const RI = RA / 3; // inner disc radius
const R = Math.ceil(RA);
const DT = 0.11; // time step
const B1 = 0.257,
  B2 = 0.336; // birth interval (dead cell)
const D1 = 0.365,
  D2 = 0.549; // survival interval (live cell)
const AN = 0.028; // neighbourhood sigmoid width
const AM = 0.147; // cell (m) sigmoid width

const SIM = 3; // target sim-cell size in screen px (grid is upscaled to fit)
const MAX_COLS = 680; // cap the grid so the convolution stays real-time
const STEP_MS = 45; // sim/render cadence (~22fps); organisms drift slowly

// Per-row disc half-widths (uniform discs, matching the prefix-sum reads) and
// their areas — depend only on the radii, so precompute once.
const HW_I = new Int32Array(2 * R + 1); // inner disc
const HW_B = new Int32Array(2 * R + 1); // full outer disc
let INNER_AREA = 0;
let BIG_AREA = 0;
for (let dy = -R; dy <= R; dy++) {
  const ii = RI * RI - dy * dy;
  const bb = RA * RA - dy * dy;
  const hi = ii >= 0 ? Math.floor(Math.sqrt(ii)) : -1;
  const hb = bb >= 0 ? Math.floor(Math.sqrt(bb)) : -1;
  HW_I[dy + R] = hi;
  HW_B[dy + R] = hb;
  if (hi >= 0) INNER_AREA += 2 * hi + 1;
  if (hb >= 0) BIG_AREA += 2 * hb + 1;
}
const ANN_AREA = BIG_AREA - INNER_AREA;

// Colormap from the original Lenia papers (the Lenia_icon4 rendering): field
// value ramps dark-plum → purple → blue → cyan → teal → green → yellow →
// orange → red → white. Colours sampled directly from the icon. Baked into a
// 256-entry LUT so rendering is a single lookup per channel.
const CMAP_STOPS: [number, number, number, number][] = [
  [0.0, 26, 18, 21],
  [0.08, 40, 27, 71],
  [0.16, 54, 41, 160],
  [0.3, 47, 97, 238],
  [0.44, 37, 157, 226],
  [0.57, 47, 222, 160],
  [0.68, 90, 252, 94],
  [0.78, 164, 243, 52],
  [0.85, 216, 211, 38],
  [0.9, 248, 162, 30],
  [0.94, 247, 94, 22],
  [0.975, 157, 9, 7],
  [1.0, 255, 255, 255],
];
const LUT_R = new Uint8Array(256);
const LUT_G = new Uint8Array(256);
const LUT_B = new Uint8Array(256);
for (let i = 0; i < 256; i++) {
  const t = i / 255;
  let s = 0;
  while (s < CMAP_STOPS.length - 2 && t > CMAP_STOPS[s + 1][0]) s++;
  const [p0, r0, g0, b0] = CMAP_STOPS[s];
  const [p1, r1, g1, b1] = CMAP_STOPS[s + 1];
  const f = (t - p0) / (p1 - p0 || 1);
  LUT_R[i] = r0 + (r1 - r0) * f;
  LUT_G[i] = g0 + (g1 - g0) * f;
  LUT_B[i] = b0 + (b1 - b0) * f;
}

const sig = (x: number, a: number, w: number) =>
  1 / (1 + Math.exp((-(x - a) * 4) / w));

export default function LeniaField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const grid = document.createElement("canvas");
    const gctx = grid.getContext("2d")!;

    let cols = 0;
    let rows = 0;
    let PW = 0; // padded (halo) grid width
    let RPW = 0; // prefix-sum row stride (PW + 1)
    let PH = 0;
    let W = 0;
    let H = 0;
    let img: ImageData | null = null;
    let A = new Float32Array(0); // field value in [0, 1]
    let B = new Float32Array(0); // scratch (next field)
    let G = new Float32Array(0); // growth per cell in [-1, 1] (for colour)
    let P = new Float32Array(0); // halo-padded copy of A (toroidal border)
    let rowPre = new Float32Array(0); // per-row horizontal prefix sums of P

    const seed = () => {
      A = new Float32Array(cols * rows);
      B = new Float32Array(cols * rows);
      G = new Float32Array(cols * rows);
      // Full-field random noise; the rule condenses it into organisms.
      for (let i = 0; i < A.length; i++)
        A[i] = Math.random() < 0.5 ? Math.random() : 0;
    };

    const resize = () => {
      const parent = canvas.parentElement!;
      W = parent.clientWidth;
      H = parent.clientHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = true; // crisp upscale — no bilinear blur
      const nc = Math.min(MAX_COLS, Math.max(64, Math.round(W / SIM)));
      const nr = Math.max(40, Math.round((nc * H) / W));
      if (nc !== cols || nr !== rows) {
        cols = nc;
        rows = nr;
        PW = cols + 2 * R;
        PH = rows + 2 * R;
        RPW = PW + 1;
        grid.width = cols;
        grid.height = rows;
        img = gctx.createImageData(cols, rows);
        P = new Float32Array(PW * PH);
        rowPre = new Float32Array(RPW * PH);
        seed();
      }
    };

    // Copy A into the padded buffer with a toroidal (wrap-around) halo, then
    // build a horizontal prefix sum for every padded row. A disc average is
    // then a sum of per-row spans (two prefix lookups each) — O(radius)/cell.
    const prep = () => {
      for (let py = 0; py < PH; py++) {
        const sy = ((py - R) % rows + rows) % rows;
        const prow = py * PW;
        const arow = sy * cols;
        for (let px = 0; px < PW; px++)
          P[prow + px] = A[arow + (((px - R) % cols) + cols) % cols];
        // prefix sum of this padded row
        const rr = py * RPW;
        let acc = 0;
        rowPre[rr] = 0;
        for (let px = 0; px < PW; px++) {
          acc += P[prow + px];
          rowPre[rr + px + 1] = acc;
        }
      }
    };

    const step = () => {
      prep();
      let mass = 0;
      for (let y = 0; y < rows; y++) {
        const Y = y + R;
        for (let x = 0; x < cols; x++) {
          const X = x + R;
          let inner = 0;
          let big = 0;
          for (let dy = -R; dy <= R; dy++) {
            const rr = (Y + dy) * RPW;
            const hb = HW_B[dy + R];
            if (hb >= 0) big += rowPre[rr + X + hb + 1] - rowPre[rr + X - hb];
            const hi = HW_I[dy + R];
            if (hi >= 0) inner += rowPre[rr + X + hi + 1] - rowPre[rr + X - hi];
          }
          const m = inner / INNER_AREA;
          const n = (big - inner) / ANN_AREA;
          // Interpolate birth/survival thresholds by how "alive" the cell is.
          const sm = sig(m, 0.5, AM);
          const lo = B1 * (1 - sm) + D1 * sm;
          const hi = B2 * (1 - sm) + D2 * sm;
          const s = sig(n, lo, AN) * (1 - sig(n, hi, AN));
          const g = 2 * s - 1; // growth: +1 grow, -1 decay
          const i = y * cols + x;
          const v = A[i] + DT * g;
          const nv = v < 0 ? 0 : v > 1 ? 1 : v;
          B[i] = nv;
          G[i] = g;
          mass += nv;
        }
      }
      const t = A;
      A = B;
      B = t;
      // The glider rule is self-sustaining, but guard against a rare die-off.
      if (mass < cols * rows * 0.02) seed();
    };

    const render = () => {
      if (!img) return;
      const d = img.data;
      const n = cols * rows;
      for (let i = 0; i < n; i++) {
        const a = A[i];
        const idx = a <= 0 ? 0 : a >= 1 ? 255 : (a * 255) | 0;
        const p = i << 2;
        d[p] = LUT_R[idx];
        d[p + 1] = LUT_G[idx];
        d[p + 2] = LUT_B[idx];
        d[p + 3] = 255;
      }
      gctx.putImageData(img, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(grid, 0, 0, cols, rows, 0, 0, W, H);
    };

    resize();

    let raf = 0;
    let last = 0;
    const loop = (time: number) => {
      if (time - last >= STEP_MS) {
        step();
        render();
        last = time;
      }
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (!raf) {
        last = 0;
        raf = requestAnimationFrame(loop);
      }
    };
    const stop = () => {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    // Pause the (heavy) simulation whenever the hero is scrolled out of view.
    let io: IntersectionObserver | null = null;
    if (reduced) {
      for (let i = 0; i < 80; i++) step();
      render();
    } else {
      render();
      io = new IntersectionObserver(
        ([e]) => (e.isIntersecting ? start() : stop()),
        { threshold: 0 },
      );
      io.observe(canvas);
    }

    const ro = new ResizeObserver(() => {
      resize();
      if (reduced) {
        for (let i = 0; i < 80; i++) step();
        render();
      }
    });
    ro.observe(canvas.parentElement!);

    return () => {
      stop();
      io?.disconnect();
      ro.disconnect();
    };
  }, [reduced]);

  return <canvas ref={canvasRef} className="lenia-field" aria-hidden="true" />;
}
