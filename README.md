# ~/portfolio — ASCII personal site + Obsidian-style digital garden

A responsive personal portfolio rendered in a terminal / ASCII-art aesthetic.
Everything is monospace and box-drawing chars: an animated hero, sections for
projects / research / resume / socials, and — the centerpiece — an
**Obsidian-style digital garden** whose notes form an interactive **ASCII knowledge
graph**.

Built with **Vite + React + TypeScript**. No database: your Markdown lives in a
folder structure and is compiled into a graph at build time. Deploys to GitHub
Pages as a static site.

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # -> dist/ (also writes dist/404.html for deep links)
npm run preview    # serve the production build locally
```

## Writing the digital garden

Drop Markdown files into `digital-garden/<group>/<note>.md`. **Folders are groups** —
each folder becomes a node in the graph connected to the notes inside it.

```
digital-garden/
├── systems/
│   ├── append-only-logs.md
│   └── consensus.md
└── essays/
    └── digital-gardens.md
```

Frontmatter (all optional except you'll usually want a title):

```markdown
---
title: Append-Only Logs
date: 2026-05-02
tags: [storage, databases]
summary: One-line description shown in listings.
byline: Author · Venue     # optional subtitle (great for papers)
status: shipped            # optional badge (great for projects)
star: true                 # feature it in the curated "starred" section
links:                     # primary/artifact links (repo, pdf, demo…)
  - label: repo
    href: https://github.com/you/thing
  - label: paper
    href: /papers/thing.pdf
---
```

Any page — including **projects**, which live in `digital-garden/projects/` — can
carry these. `links:` renders as primary artifact buttons on the page and in
listings; `star: true` surfaces the page on the **`/curated`** page (and the home
teaser) so visitors can reach the good stuff fast.

**PDF-only pages.** A page with no body text but a `links:` PDF is treated as a
pointer to that PDF — visiting it opens the full-screen viewer directly instead
of an empty note. The résumé (`digital-garden/personal/resume.md`) works this way.

The **projects**, **research**, and **curated** pages have tag/group filters and
sort controls (newest / oldest / a–z).

**Link notes with `[[wiki-links]]`** — by title, filename, or `group/slug`:

```markdown
This rests on [[Append-Only Logs]] and, with an alias, [[Consensus|agreement]].
```

Each link becomes an edge in the graph and a backlink on the target note.
Unresolved links render in amber so you can spot typos. Add or edit a file and
the dev server rebuilds the graph automatically.

There are two ways to navigate: the **graph** (drag / scroll to zoom / hover to
trace / click a note to open) and the **explorer** (a collapsible ASCII file
tree). The garden page toggles between them; small screens default to the
explorer.

## Make it yours

| What | Where |
| --- | --- |
| Name, tagline, hero banner font | `src/data/site.ts` |
| Social links | `src/data/socials.ts` |
| Projects | `digital-garden/projects/*.md` (garden pages with `links:` + `status:`) |
| Research / writing | `digital-garden/research/*.md` (use `byline:` for authors · venue) |
| Résumé | `digital-garden/personal/resume.md` + `public/resume.pdf` (opens a full-screen viewer) |
| Colors / theme | `src/styles/theme.css` (CSS variables at the top) |
| Group accent palette | `GROUP_COLORS` in `plugins/vite-plugin-content.ts` |

The hero wordmark is generated from `site.name` with figlet — change
`bannerFont` in `site.ts` to any font in `figlet/importable-fonts`
(e.g. `"Slant"`, `"Standard"`, `"Small Slant"`).

## Deploying to GitHub Pages

1. Push to `main`. The workflow in `.github/workflows/deploy.yml` builds and
   deploys automatically.
2. In the repo: **Settings → Pages → Build and deployment → Source: GitHub
   Actions**.

This is configured for a **root-domain** deploy (`username.github.io` or a
custom domain), so `vite.config.ts` uses `base: '/'`.

- **Custom domain:** add a `public/CNAME` file containing your domain.
- **Project page** (`username.github.io/repo`): set `base: '/repo/'` in
  `vite.config.ts`.

Clean URLs work on Pages because the build copies `index.html` to `404.html`
(see `scripts/postbuild.mjs`), which the SPA router then resolves.

## How it fits together

```
digital-garden/*.md ──► plugins/vite-plugin-content.ts ──► src/generated/manifest.json
                    (parse · render · graph)              │
                                                          ▼
                             React app (graph, explorer, notes) ──► dist/
```
