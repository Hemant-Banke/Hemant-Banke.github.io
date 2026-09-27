# Hemant-Banke.github.io

![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)
![D3](https://img.shields.io/badge/d3--force-F9A03C?logo=d3dotjs&logoColor=white)
![Markdown](https://img.shields.io/badge/Markdown-000000?logo=markdown&logoColor=white)
![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-222222?logo=githubpages&logoColor=white)

My personal site and digital garden. Vite + React + TypeScript, deployed to
GitHub Pages.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # -> dist/
```

## Add a post

Write Markdown in `digital-garden/<folder>/<post>.md`. The folder is the post's
group (`research/` and `projects/` also get their own pages).

```markdown
---
title: My Post
date: 2026-09-27
summary: One line shown in listings.
tags: [statistics]
byline: with Someone · Somewhere   # optional
status: ongoing                    # optional
star: true                         # optional, adds a ★
links:                             # optional buttons
  - label: pdf
    href: /artifacts/my-report.pdf
---

Body text. Link other posts with [[Post Title]] or [[folder/post|custom text]].
```

PDFs and other files go in `public/artifacts/` and are linked directly.

## Edit

- Name, intro: `src/data/site.ts`
- Social links: `src/data/socials.ts`
- Colours: `src/styles/theme.css`

## Deploy

Pushing to `master` builds and deploys via `.github/workflows/deploy.yml`.
