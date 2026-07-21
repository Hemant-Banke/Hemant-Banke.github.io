# CLAUDE.md

ASCII-aesthetic personal portfolio + Obsidian-style digital garden. Vite + React + TS,
static, deployed to GitHub Pages (root domain, `base: '/'`).

## Commands
- `npm run dev` — dev server at :5173 (content manifest rebuilds on `digital-garden/` edits)
- `npm run build` — `tsc -b && vite build && node scripts/postbuild.mjs` (writes `dist/`, plus `dist/404.html`)
- `npm run preview` — serve the production build
- `npm run typecheck` — types only

## Architecture
- **Content pipeline** — `plugins/vite-plugin-content.ts` scans `digital-garden/`, parses
  frontmatter (`gray-matter`), renders Markdown (`markdown-it`), resolves
  `[[wiki-links]]`, and emits `src/generated/manifest.json` (gitignored) with
  `{ notes, groups, graph:{nodes,edges}, tree }`. Types in `src/content/types.ts`;
  typed access via `src/content/manifest.ts`.
  - The manifest is generated at dev-server start / build. If you run `tsc`
    standalone before ever building, generate it first (the build does this).
- **Graph** — `src/components/AsciiGraph.tsx`: `d3-force` layout drawn as
  monospace glyphs on `<canvas>`. Group nodes = box-drawn labels, notes =
  bulleted labels, edges = stippled ascii. Pan/zoom/hover/click; auto-fits after
  settle; reduced-motion runs the sim synchronously. Reused for the note-page
  mini-graph via `mini` + `focusId`.
- **Explorer** — `src/components/FileTree.tsx`: collapsible `tree`-style view.
- **Hero** — `src/components/LeniaField.tsx` (SmoothLife CA background:
  self-organising green/cyan/magenta organisms on `<canvas>`, tuned glider
  regime so it never just flashes) + figlet wordmark (`src/lib/ascii.ts`) +
  `Typed.tsx`.
- **ASCII reaction-diffusion** — `src/components/AsciiField.tsx`: Gray-Scott
  reaction-diffusion (moving-spots regime) on a character grid, drawn as
  density-ramped glyphs. Emergent drifting/splitting cells. Used as the
  letterbox backdrop behind the PDF reader (`PdfFullscreen.tsx`).
- **Routing** — `BrowserRouter`; notes at `/digital-garden/*` (splat = note slug).
- **Static content** — `src/data/*` (site, socials, projects, research, resume).
- **Styles** — `src/styles/{theme,app,hero,garden}.css`. Palette = CSS variables at
  the top of `theme.css`.

## Conventions
- Terminal aesthetic: monospace everywhere, box-drawing borders, green/cyan/
  magenta accents (amber = broken/unresolved). Keep new UI in that language.
- Respect `prefers-reduced-motion` (see `src/lib/hooks.ts`) for anything animated.
- `useEffect` callbacks must return a cleanup function or nothing — never an
  expression value (that crashes React's StrictMode double-invoke).
