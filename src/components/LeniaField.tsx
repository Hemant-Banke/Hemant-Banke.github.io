import { useEffect, useRef } from "react";
import { useReducedMotion } from "../lib/hooks";

// Particle Life — an agent-based simulation in the spirit of Jeffrey Ventrella's
// "Clusters" and Tom Mohr's particle-life. Thousands of coloured particles,
// each belonging to one of a few species, feel a per-species-pair attraction /
// repulsion governed by a small random interaction matrix. Close range is
// always repulsive (so nothing collapses to a point); the mid range pulls or
// pushes by species. From uniform random noise this self-organises into
// chasing cells, orbiting membranes and slow drifting colonies that never
// settle — every frame is emergent, nothing is pre-baked.
//
// Rendered as soft additive glow dots in the site palette (green / cyan /
// magenta / violet) on near-black.

// --- species palette --------------------------------------------------------
// [r, g, b] per species, drawn from the terminal accent colours.
const SPECIES: [number, number, number][] = [
  [69, 240, 138], // green
  [67, 209, 230], // cyan
  [255, 106, 213], // magenta
  [139, 124, 255], // violet
];
const NSPECIES = SPECIES.length;

// --- simulation tunables ----------------------------------------------------
const R_FRACTION = 0.11; // interaction radius as a fraction of min(W,H)
const R_MIN = 60; // clamp for interaction radius (px)
const R_MAX = 150;
const BETA = 0.3; // inner fraction of the radius that is purely repulsive
const FORCE = 9; // global force scale
const DT = 0.02; // integration step
const FRICTION_HALFLIFE = 0.042; // velocity half-life (s) → damping
const DENSITY = 520; // screen px² per particle (smaller = more particles)
const MAX_PARTICLES = 3200;
const CORE = 2; // solid dot radius (px)
const GLOW = 2; // glow falloff radius (px)

// A random asymmetric interaction matrix: attraction[a][b] ∈ [-1, 1] is how
// species a feels about species b. Asymmetry (a↔b differ) is what makes them
// chase and orbit rather than just clump.
function randomMatrix() {
  const m: number[][] = [];
  for (let a = 0; a < NSPECIES; a++) {
    m[a] = [];
    for (let b = 0; b < NSPECIES; b++) m[a][b] = Math.random() * 2 - 1;
  }
  return m;
}

// Build a small additive-glow sprite for a species: bright core + soft halo,
// so drawing a particle is one cheap drawImage instead of a per-frame gradient.
function makeSprite([r, g, b]: [number, number, number]) {
  const rad = CORE + GLOW;
  const size = Math.ceil(rad * 2);
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const cx = c.getContext("2d")!;
  const grad = cx.createRadialGradient(rad, rad, 0, rad, rad, rad);
  grad.addColorStop(0, `rgba(${r},${g},${b},1)`);
  grad.addColorStop(0.35, `rgba(${r},${g},${b},0.55)`);
  grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
  cx.fillStyle = grad;
  cx.beginPath();
  cx.arc(rad, rad, rad, 0, Math.PI * 2);
  cx.fill();
  return c;
}

export default function LeniaField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const sprites = SPECIES.map(makeSprite);
    const attraction = randomMatrix();
    const friction = Math.pow(0.5, DT / FRICTION_HALFLIFE);

    let W = 0;
    let H = 0;
    let rMax = 100;

    // Particle state (pixel space).
    let px = new Float32Array(0);
    let py = new Float32Array(0);
    let vx = new Float32Array(0);
    let vy = new Float32Array(0);
    let sp = new Uint8Array(0);
    let n = 0;

    // Uniform-grid spatial hash for neighbour queries.
    let cols = 1;
    let rows = 1;
    let cellW = 1;
    let cellH = 1;
    let head = new Int32Array(0); // first particle index per cell, or -1
    let nextP = new Int32Array(0); // linked-list of particles within a cell

    const seed = () => {
      n = Math.min(MAX_PARTICLES, Math.max(200, Math.round((W * H) / DENSITY)));
      px = new Float32Array(n);
      py = new Float32Array(n);
      vx = new Float32Array(n);
      vy = new Float32Array(n);
      sp = new Uint8Array(n);
      nextP = new Int32Array(n);
      for (let i = 0; i < n; i++) {
        px[i] = Math.random() * W;
        py[i] = Math.random() * H;
        vx[i] = 0;
        vy[i] = 0;
        sp[i] = (Math.random() * NSPECIES) | 0;
      }
    };

    const resize = () => {
      const parent = canvas.parentElement!;
      const nw = Math.max(1, parent.clientWidth);
      const nh = Math.max(1, parent.clientHeight);
      if (nw === W && nh === H) return false;
      W = nw;
      H = nh;
      canvas.width = W;
      canvas.height = H;
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      rMax = Math.min(R_MAX, Math.max(R_MIN, Math.min(W, H) * R_FRACTION));
      cols = Math.max(1, Math.floor(W / rMax));
      rows = Math.max(1, Math.floor(H / rMax));
      cellW = W / cols;
      cellH = H / rows;
      head = new Int32Array(cols * rows);
      seed();
      return true;
    };

    // Bucket every particle into its grid cell (rebuilt each step).
    const rebuildGrid = () => {
      head.fill(-1);
      for (let i = 0; i < n; i++) {
        let cx = (px[i] / cellW) | 0;
        let cy = (py[i] / cellH) | 0;
        if (cx < 0) cx = 0;
        else if (cx >= cols) cx = cols - 1;
        if (cy < 0) cy = 0;
        else if (cy >= rows) cy = rows - 1;
        const cell = cy * cols + cx;
        nextP[i] = head[cell];
        head[cell] = i;
      }
    };

    // Piecewise particle-life force as a function of normalised distance r∈[0,1]
    // and the species-pair attraction a: hard repulsion inside BETA, then a
    // triangular attraction/repulsion ramp out to the interaction radius.
    const forceFn = (r: number, a: number) => {
      if (r < BETA) return r / BETA - 1;
      if (r < 1) return a * (1 - Math.abs(2 * r - 1 - BETA) / (1 - BETA));
      return 0;
    };

    const step = () => {
      rebuildGrid();
      const r2 = rMax * rMax;
      const halfW = W / 2;
      const halfH = H / 2;
      for (let i = 0; i < n; i++) {
        const xi = px[i];
        const yi = py[i];
        const ai = sp[i];
        const row = attraction[ai];
        let fx = 0;
        let fy = 0;
        const cx = Math.min(cols - 1, Math.max(0, (xi / cellW) | 0));
        const cy = Math.min(rows - 1, Math.max(0, (yi / cellH) | 0));
        for (let gy = -1; gy <= 1; gy++) {
          let ny = cy + gy;
          if (ny < 0) ny += rows; // wrap grid (toroidal field)
          else if (ny >= rows) ny -= rows;
          for (let gx = -1; gx <= 1; gx++) {
            let nx = cx + gx;
            if (nx < 0) nx += cols;
            else if (nx >= cols) nx -= cols;
            let j = head[ny * cols + nx];
            while (j !== -1) {
              if (j !== i) {
                // minimum-image delta so forces wrap seamlessly across edges
                let dx = px[j] - xi;
                let dy = py[j] - yi;
                if (dx > halfW) dx -= W;
                else if (dx < -halfW) dx += W;
                if (dy > halfH) dy -= H;
                else if (dy < -halfH) dy += H;
                const d2 = dx * dx + dy * dy;
                if (d2 > 0 && d2 < r2) {
                  const d = Math.sqrt(d2);
                  const f = forceFn(d / rMax, row[sp[j]]);
                  fx += (dx / d) * f;
                  fy += (dy / d) * f;
                }
              }
              j = nextP[j];
            }
          }
        }
        fx *= rMax * FORCE;
        fy *= rMax * FORCE;
        vx[i] = vx[i] * friction + fx * DT;
        vy[i] = vy[i] * friction + fy * DT;
      }
      // Integrate + wrap.
      for (let i = 0; i < n; i++) {
        let x = px[i] + vx[i] * DT;
        let y = py[i] + vy[i] * DT;
        if (x < 0) x += W;
        else if (x >= W) x -= W;
        if (y < 0) y += H;
        else if (y >= H) y -= H;
        px[i] = x;
        py[i] = y;
      }
    };

    const rad = CORE + GLOW;
    const render = () => {
      // Faint trail wash keeps a little motion smear over the dark backdrop.
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "rgba(10,13,12,0.34)";
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < n; i++) {
        ctx.drawImage(sprites[sp[i]], px[i] - rad, py[i] - rad);
      }
      ctx.globalCompositeOperation = "source-over";
    };

    resize();

    let raf = 0;
    const loop = () => {
      step();
      render();
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    // Pause when the hero scrolls out of view.
    let io: IntersectionObserver | null = null;
    if (reduced) {
      for (let i = 0; i < 260; i++) step();
      render();
    } else {
      render();
      io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()), {
        threshold: 0,
      });
      io.observe(canvas);
    }

    const ro = new ResizeObserver(() => {
      if (resize() && reduced) {
        for (let i = 0; i < 260; i++) step();
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
