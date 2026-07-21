import { useEffect, useRef } from "react";
import { useReducedMotion } from "../lib/hooks";

// Gray-Scott reaction-diffusion sampled on a character grid and drawn as
// density-ramped ASCII glyphs. Two virtual chemicals (U, V) diffuse and react
// (U + 2V → 3V, V decays); from a scatter of seed droplets the field
// self-organises into drifting cells that split and wander — genuine emergent
// complexity, not a scripted plasma. Tuned to the "moving spots" regime
// (f=0.018, k=0.051) so it never freezes. Used as the letterbox backdrop
// behind the PDF reader.

const F = 0.018; // feed rate
const K = 0.051; // kill rate
const DU = 0.16; // U diffusion
const DV = 0.08; // V diffusion
const SUBSTEPS = 12; // reaction iterations per rendered frame (evolution speed)
const FRAME_MS = 45; // ~22fps render cadence

// Density ramp with no blanks: the low-density "fur" is a fine speckle and the
// reaction-diffusion spots pack into dense glyphs — a cheetah pelt.
const RAMP = ".·:-=+*oO#@";
const FONT_PX = 15;

// Cheetah palette — golden-tan fur (low density) shading through amber into
// dark-brown spot cores (dense). Each Gray-Scott spot renders as a tan-rimmed
// brown blotch, so the field reads as a spotted pelt.
const FUR = [235, 190, 98];
const AMBER = [150, 92, 34];
const SPOT = [58, 32, 14];
const mix = (a: number[], b: number[], t: number, i: number) =>
  Math.round(a[i] + (b[i] - a[i]) * t);
const cheetah = (h: number) => {
  const [a, b, t] = h < 0.5 ? [FUR, AMBER, h * 2] : [AMBER, SPOT, (h - 0.5) * 2];
  return `rgb(${mix(a, b, t, 0)},${mix(a, b, t, 1)},${mix(a, b, t, 2)})`;
};

export default function AsciiField({ className = "ascii-field" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0;
    let H = 0;
    let cols = 0;
    let rows = 0;
    let charW = 0;
    const rowH = Math.round(FONT_PX * 1.18);

    let U = new Float32Array(0);
    let V = new Float32Array(0);
    let U2 = new Float32Array(0);
    let V2 = new Float32Array(0);

    const setFont = () => {
      ctx.font = `${FONT_PX}px "SFMono-Regular", "JetBrains Mono", ui-monospace, monospace`;
      ctx.textBaseline = "top";
      charW = ctx.measureText("M").width || FONT_PX * 0.6;
    };

    // Drop a circular seed of V (with some U consumed) at a grid cell.
    const droplet = (cx: number, cy: number, rr: number) => {
      for (let dy = -rr; dy <= rr; dy++)
        for (let dx = -rr; dx <= rr; dx++) {
          if (dx * dx + dy * dy > rr * rr) continue;
          const x = (cx + dx + cols) % cols;
          const y = (cy + dy + rows) % rows;
          const i = y * cols + x;
          U[i] = 0.5;
          V[i] = 0.28;
        }
    };

    const seed = () => {
      U = new Float32Array(cols * rows).fill(1);
      V = new Float32Array(cols * rows);
      U2 = new Float32Array(cols * rows);
      V2 = new Float32Array(cols * rows);
      const patches = Math.max(12, Math.round((cols * rows) / 700));
      for (let p = 0; p < patches; p++)
        droplet((Math.random() * cols) | 0, (Math.random() * rows) | 0, 2 + ((Math.random() * 3) | 0));
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
      setFont();
      const nc = Math.ceil(W / charW) + 1;
      const nr = Math.ceil(H / rowH) + 1;
      if (nc !== cols || nr !== rows) {
        cols = nc;
        rows = nr;
        seed();
      }
    };

    // One Gray-Scott iteration (9-point Laplacian, toroidal wrap).
    const step = () => {
      for (let y = 0; y < rows; y++) {
        const ym = ((y - 1 + rows) % rows) * cols;
        const yp = ((y + 1) % rows) * cols;
        const yc = y * cols;
        for (let x = 0; x < cols; x++) {
          const xm = (x - 1 + cols) % cols;
          const xp = (x + 1) % cols;
          const i = yc + x;
          const u = U[i];
          const v = V[i];
          const lu =
            (U[yc + xm] + U[yc + xp] + U[ym + x] + U[yp + x]) * 0.2 +
            (U[ym + xm] + U[ym + xp] + U[yp + xm] + U[yp + xp]) * 0.05 -
            u;
          const lv =
            (V[yc + xm] + V[yc + xp] + V[ym + x] + V[yp + x]) * 0.2 +
            (V[ym + xm] + V[ym + xp] + V[yp + xm] + V[yp + xp]) * 0.05 -
            v;
          const uvv = u * v * v;
          U2[i] = u + (DU * lu - uvv + F * (1 - u));
          V2[i] = v + (DV * lv + uvv - (F + K) * v);
        }
      }
      let t = U;
      U = U2;
      U2 = t;
      t = V;
      V = V2;
      V2 = t;
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      const last = RAMP.length - 1;
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const v = V[y * cols + x];
          const n = v * 2.8; // → ~[0,1] for the "moving" regime
          const nn = n > 1 ? 1 : n;
          const gi = (nn * last) | 0;
          ctx.fillStyle = cheetah(nn);
          ctx.fillText(RAMP[gi], x * charW, y * rowH);
        }
      }
    };

    resize();

    let raf = 0;
    let sinceSeed = 0;
    if (reduced) {
      for (let i = 0; i < 600; i++) step(); // settle to a rich static frame
      draw();
    } else {
      let last = 0;
      const loop = (time: number) => {
        if (time - last >= FRAME_MS) {
          for (let s = 0; s < SUBSTEPS; s++) step();
          // Occasionally drop a fresh colony so the field keeps re-seeding
          // itself with new structure over long sessions.
          if (++sinceSeed >= 120) {
            droplet((Math.random() * cols) | 0, (Math.random() * rows) | 0, 3);
            sinceSeed = 0;
          }
          draw();
          last = time;
        }
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    }

    const ro = new ResizeObserver(() => {
      resize();
      if (reduced) {
        for (let i = 0; i < 600; i++) step();
        draw();
      }
    });
    ro.observe(canvas.parentElement!);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [reduced, className]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
