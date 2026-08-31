// Pre-generate the force-directed layout for every graph the site draws — the
// full knowledge graph plus one subset graph per note — into
// src/generated/layouts.json. AsciiGraph reads those positions directly instead
// of running d3-force in the browser.
//
//   npm run gen:graph          re-lay-out from the existing manifest
//   npm run gen:graph -- --all rescan digital-garden/ first, then lay out
//
// `npm run gen` (and therefore dev/build) already does both, so this is for
// re-baking layouts on their own — e.g. after tuning the forces in
// plugins/graph-layout.mjs.
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  LAYOUTS_FILE,
  MANIFEST_FILE,
  buildManifest,
  writeContent,
} from "../plugins/content-core.mjs";
import { buildLayouts } from "../plugins/graph-layout.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const gardenDir = path.join(root, "digital-garden");
const outDir = path.join(root, "src/generated");
const rescan = process.argv.includes("--all");

// Read the manifest we already have; rebuild it from the garden if it's
// missing (fresh checkout) or the caller asked for a full rescan.
async function loadManifest() {
  if (!rescan) {
    try {
      return JSON.parse(
        await fs.readFile(path.join(outDir, MANIFEST_FILE), "utf8"),
      );
    } catch {
      // fall through to a rescan
    }
  }
  return buildManifest(gardenDir);
}

if (rescan) {
  const { layouts } = await writeContent(gardenDir, outDir);
  report(layouts);
} else {
  const manifest = await loadManifest();
  const layouts = buildLayouts(manifest);
  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(
    path.join(outDir, LAYOUTS_FILE),
    JSON.stringify(layouts, null, 2),
  );
  report(layouts);
}

function report(layouts) {
  const notes = Object.keys(layouts.notes).length;
  const full = Object.keys(layouts.full.positions).length;
  console.log(
    `gen-graph-layout: full graph (${full} nodes) + ${notes} note subgraphs → ` +
      path.relative(root, path.join(outDir, LAYOUTS_FILE)),
  );
}
