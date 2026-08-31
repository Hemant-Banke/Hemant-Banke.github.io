import { useEffect, useRef } from "react";
import { useReducedMotion, whileVisible } from "../lib/hooks";

// Morphogenesis — the loop that makes the Growing-NCA demos worth watching:
// a single seed cell grows into a patterned organism, holds its size, and
// regrows when a bite is taken out of it. Every rule here is local; nothing
// knows the body plan.
//
// Two coupled fields:
//   A  tissue. A bistable phase field, so the boundary is a travelling front
//      rather than a blur. Its threshold is driven by total mass, which is what
//      makes the organism stop at a size — and start growing again after damage.
//   U,V pigment. Gray–Scott in the spot regime, reacting only on live tissue,
//      seeded at the growth front so pattern lays down as the body extends.
//
// The rule is hand-built, not trained: growing one specific creature (the
// Distill lizard) takes learned weights, which can't be fitted here.

// --- tissue -----------------------------------------------------------------
const DA = 0.34; // tissue diffusion
const RATE = 0.42; // front speed
const DRIVE = 0.36; // how hard mass feedback pushes the front
const TARGET_FILL = 0.3; // fraction of the grid the body settles at
const LOBES = 0.13; // amplitude of the static noise field that shapes it

// --- pigment ----------------------------------------------------------------
const DU = 0.16;
const DV = 0.08;
const F = 0.028; // feed
const K = 0.058; // kill — this pair is the spot regime
const SEED_RATE = 0.01; // chance a front cell picks up pigment

// --- run --------------------------------------------------------------------
const CELL_PX = 6;
const MAX_CELLS = 9000;
const FRAME_MS = 60;
const SUBSTEPS = 3; // rule is cheap; step faster than we draw
const DAMAGE_EVERY = 1100; // steps between bites
const ALIVE = 0.45; // tissue threshold

// green body, cyan rim, magenta pigment
const BODY: [number, number, number] = [56, 190, 120];
const RIM: [number, number, number] = [67, 209, 230];
const SPOT: [number, number, number] = [255, 106, 213];

export default function Morphogenesis() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let W = 0;
    let H_PX = 0;
    let cols = 0;
    let rows = 0;

    let A = new Float32Array(0);
    let U = new Float32Array(0);
    let V = new Float32Array(0);
    let A2 = new Float32Array(0);
    let U2 = new Float32Array(0);
    let V2 = new Float32Array(0);
    let NOISE = new Float32Array(0);

    // Low-frequency noise: blurred white noise, so the front advances unevenly
    // and the body grows lobes instead of a perfect disc.
    const buildNoise = () => {
      const n = cols * rows;
      let tmp = new Float32Array(n);
      let out = new Float32Array(n);
      for (let i = 0; i < n; i++) tmp[i] = Math.random() * 2 - 1;
      for (let p = 0; p < 6; p++) {
        for (let y = 0; y < rows; y++) {
          const yc = y * cols;
          const ym = ((y - 1 + rows) % rows) * cols;
          const yp = ((y + 1) % rows) * cols;
          for (let x = 0; x < cols; x++) {
            const xm = (x - 1 + cols) % cols;
            const xp = (x + 1) % cols;
            out[yc + x] =
              (tmp[yc + x] + tmp[yc + xm] + tmp[yc + xp] + tmp[ym + x] + tmp[yp + x]) / 5;
          }
        }
        const s = tmp;
        tmp = out;
        out = s;
      }
      let mx = 1e-6;
      for (let i = 0; i < n; i++) mx = Math.max(mx, Math.abs(tmp[i]));
      NOISE = new Float32Array(n);
      for (let i = 0; i < n; i++) NOISE[i] = (tmp[i] / mx) * LOBES;
    };

    // One cell of tissue in the middle, and a fresh body plan.
    const seed = () => {
      const n = cols * rows;
      A = new Float32Array(n);
      U = new Float32Array(n).fill(1);
      V = new Float32Array(n);
      A2 = new Float32Array(n);
      U2 = new Float32Array(n);
      V2 = new Float32Array(n);
      buildNoise();
      const cx = cols >> 1;
      const cy = rows >> 1;
      for (let y = -2; y <= 2; y++)
        for (let x = -2; x <= 2; x++) {
          if (x * x + y * y > 4) continue;
          const i = (cy + y) * cols + (cx + x);
          A[i] = 1;
          V[i] = 0.5;
        }
    };

    // Take a bite out of the body — the interesting half of the demo.
    const damage = () => {
      const live: number[] = [];
      for (let i = 0; i < cols * rows; i++) if (A[i] > 0.5) live.push(i);
      if (!live.length) return;
      const pick = live[(Math.random() * live.length) | 0];
      const cx = pick % cols;
      const cy = (pick / cols) | 0;
      const r = Math.max(3, Math.round(Math.min(cols, rows) * 0.2));
      for (let y = -r; y <= r; y++)
        for (let x = -r; x <= r; x++) {
          if (x * x + y * y > r * r) continue;
          const i =
            ((((cy + y) % rows) + rows) % rows) * cols + ((((cx + x) % cols) + cols) % cols);
          A[i] = 0;
          V[i] = 0;
          U[i] = 1;
        }
    };

    const step = () => {
      const n = cols * rows;
      let mass = 0;
      for (let i = 0; i < n; i++) mass += A[i];
      // Mass feedback: below target the front advances, above it retreats.
      // Damage drops mass, which is exactly what triggers regrowth.
      const drive = Math.max(-1, Math.min(1, 1 - mass / (TARGET_FILL * n)));
      const push = DRIVE * drive;

      for (let y = 0; y < rows; y++) {
        const yc = y * cols;
        const ym = ((y - 1 + rows) % rows) * cols;
        const yp = ((y + 1) % rows) * cols;
        for (let x = 0; x < cols; x++) {
          const xm = (x - 1 + cols) % cols;
          const xp = (x + 1) % cols;
          const i = yc + x;
          const a = A[i];
          const u = U[i];
          const v = V[i];

          const la =
            (A[yc + xm] + A[yc + xp] + A[ym + x] + A[yp + x]) * 0.2 +
            (A[ym + xm] + A[ym + xp] + A[yp + xm] + A[yp + xp]) * 0.05 - a;
          const lu =
            (U[yc + xm] + U[yc + xp] + U[ym + x] + U[yp + x]) * 0.2 +
            (U[ym + xm] + U[ym + xp] + U[yp + xm] + U[yp + xp]) * 0.05 - u;
          const lv =
            (V[yc + xm] + V[yc + xp] + V[ym + x] + V[yp + x]) * 0.2 +
            (V[ym + xm] + V[ym + xp] + V[yp + xm] + V[yp + xp]) * 0.05 - v;

          const th = 0.5 - push + NOISE[i];
          const na = a + DA * la + RATE * a * (1 - a) * (a - th);
          A2[i] = na < 0 ? 0 : na > 1 ? 1 : na;

          // Pigment seeds where tissue is still forming.
          let vv = v;
          if (a > 0.35 && a < 0.75 && Math.random() < SEED_RATE) vv = Math.min(1, v + 0.55);
          const on = a > ALIVE ? 1 : 0;
          const uvv = u * vv * vv * on;
          const nu = u + DU * lu - uvv + F * (1 - u);
          const nv = vv + DV * lv + uvv - (F + K) * vv - (1 - on) * vv * 0.25;
          U2[i] = nu < 0 ? 0 : nu > 1 ? 1 : nu;
          V2[i] = nv < 0 ? 0 : nv > 1 ? 1 : nv;
        }
      }
      let t = A;
      A = A2;
      A2 = t;
      t = U;
      U = U2;
      U2 = t;
      t = V;
      V = V2;
      V2 = t;
      return mass / n;
    };

    // --- render: one pixel per cell, blitted up with smoothing off ----------
    const grid = document.createElement("canvas");
    const gctx = grid.getContext("2d");
    let img: ImageData | null = null;

    const resize = () => {
      const parent = canvas.parentElement!;
      W = Math.max(1, parent.clientWidth);
      H_PX = Math.max(1, parent.clientHeight);
      canvas.width = Math.max(1, Math.round(W * dpr));
      canvas.height = Math.max(1, Math.round(H_PX * dpr));
      canvas.style.width = W + "px";
      canvas.style.height = H_PX + "px";
      ctx.imageSmoothingEnabled = false;

      let px = CELL_PX;
      let nc = Math.max(8, Math.ceil(W / px));
      let nr = Math.max(8, Math.ceil(H_PX / px));
      while (nc * nr > MAX_CELLS && px < 40) {
        px += 1;
        nc = Math.max(8, Math.ceil(W / px));
        nr = Math.max(8, Math.ceil(H_PX / px));
      }
      if (nc !== cols || nr !== rows) {
        cols = nc;
        rows = nr;
        grid.width = cols;
        grid.height = rows;
        img = gctx ? gctx.createImageData(cols, rows) : null;
        seed();
      }
    };

    const draw = () => {
      if (!gctx || !img) return;
      const px = img.data;
      const n = cols * rows;
      for (let i = 0; i < n; i++) {
        const o = i * 4;
        const a = A[i];
        if (a < 0.3) {
          px[o + 3] = 0;
          continue;
        }
        // Rim reads cyan, interior settles to green, pigment pulls magenta.
        const edge = a < 0.75 ? (0.75 - a) / 0.45 : 0;
        let r = BODY[0] + (RIM[0] - BODY[0]) * edge;
        let g = BODY[1] + (RIM[1] - BODY[1]) * edge;
        let b = BODY[2] + (RIM[2] - BODY[2]) * edge;
        const s = Math.max(0, Math.min(1, (V[i] - 0.12) / 0.22));
        if (s > 0) {
          r += (SPOT[0] - r) * s;
          g += (SPOT[1] - g) * s;
          b += (SPOT[2] - b) * s;
        }
        px[o] = r | 0;
        px[o + 1] = g | 0;
        px[o + 2] = b | 0;
        px[o + 3] = (Math.min(1, a * 1.25) * 235) | 0;
      }
      gctx.putImageData(img, 0, 0);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(grid, 0, 0, cols, rows, 0, 0, canvas.width, canvas.height);
    };

    resize();

    let raf = 0;
    let ticks = 0;
    const advance = () => {
      let fill = 0;
      for (let s = 0; s < SUBSTEPS; s++) fill = step();
      ticks += SUBSTEPS;
      if (ticks % DAMAGE_EVERY < SUBSTEPS && fill > TARGET_FILL * 0.7) damage();
      // Only when the field is genuinely empty. This used to be 0.002,
      // which is *above* the seed's own fill (13 cells) — so it reseeded
      // every frame and the organism never got past its first shape.
      if (fill < 1e-5) seed();
    };

    if (reduced) {
      for (let i = 0; i < 700; i++) step();
      draw();
      const ro = new ResizeObserver(() => {
        resize();
        for (let i = 0; i < 700; i++) step();
        draw();
      });
      ro.observe(canvas.parentElement!);
      return () => ro.disconnect();
    }

    draw();
    let last = 0;
    const loop = (time: number) => {
      if (time - last >= FRAME_MS) {
        advance();
        draw();
        last = time;
      }
      raf = requestAnimationFrame(loop);
    };
    const release = whileVisible(
      canvas,
      () => {
        if (!raf) {
          last = 0;
          raf = requestAnimationFrame(loop);
        }
      },
      () => {
        if (raf) {
          cancelAnimationFrame(raf);
          raf = 0;
        }
      },
    );
    const ro = new ResizeObserver(() => resize());
    ro.observe(canvas.parentElement!);

    return () => {
      release();
      ro.disconnect();
    };
  }, [reduced]);

  return <canvas ref={canvasRef} className="morphogen-field" aria-hidden="true" />;
}
