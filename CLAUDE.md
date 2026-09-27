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
  `[[wiki-links]]`, marks each post's opening prose paragraph `p.lede` (it
  gets the IM Fell drop cap in `garden.css`), and emits `src/generated/manifest.json` (gitignored) with
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
- **Hero** — two-column split (`src/pages/Home.tsx` + `hero.css`): text on the
  left, `src/components/ParticleLife.tsx` filling the right half edge-to-edge
  (thin band above the text on phones). Agent-based particle-life sim
  (species + attraction matrix) on `<canvas>`, additive-glow on dark /
  darker-palette normal-blend on light, swapping live on the `themechange`
  event. Plus figlet wordmark (`src/lib/ascii.ts`) + `Typed.tsx`.
- **Footer garden** — `src/components/FooterGarden.tsx`: a procedurally grown
  (seeded) ASCII night garden on `<canvas>` — dithered meadow, flowers, moon,
  plus absurd bits (an eye that watches the lens, a snail, a prompt growing in
  the grass). Dim at rest; a soft lens follows the pointer and reveals a
  pre-rendered vivid copy through a radial mask. Wanders on its own on touch;
  static under reduced motion. Theme-reactive via `themechange`.
- **Routing** — `BrowserRouter`; notes at `/digital-garden/*` (splat = note slug).
- **Static content** — `src/data/*` (site, socials, projects, research).
- **PDFs** — static files in `public/artifacts/`, linked directly (open in a new tab in
  the browser's own viewer). No in-app PDF viewer.
- **Styles** — `src/styles/{theme,app,hero,garden}.css`. Palette = CSS variables at
  the top of `theme.css`.

## Conventions
- Terminal aesthetic: monospace UI chrome (JetBrains Mono), box-drawing borders,
  green/cyan/magenta accents (amber = broken/unresolved). Keep new UI in that
  language. Reading text (post bodies, titles, summaries, hero intro, `.lead`)
  is set in Newsreader (`--font-serif`, `@fontsource-variable/newsreader`) —
  add new prose selectors to the shared rule in `theme.css`.
- Starred notes (`star: true`) just get a ★ wherever they're listed; there is
  no curated page.
- Respect `prefers-reduced-motion` (see `src/lib/hooks.ts`) for anything animated.
- `useEffect` callbacks must return a cleanup function or nothing — never an
  expression value (that crashes React's StrictMode double-invoke).
