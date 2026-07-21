// GitHub Pages serves static files only. For a client-side router with clean
// URLs, a request to /digital-garden/foo must fall back to index.html. Pages uses
// 404.html as the not-found page, so copying index.html -> 404.html makes deep
// links resolve to the SPA, which then routes correctly.
import { copyFile } from "node:fs/promises";

const dist = new URL("../dist/", import.meta.url);
await copyFile(new URL("index.html", dist), new URL("404.html", dist));
console.log("postbuild: dist/404.html written");
