// Generate src/generated/manifest.json before typechecking/building, so `tsc`
// can resolve the JSON import on a fresh checkout (the Vite plugin regenerates
// it during dev and build too).
import path from "node:path";
import { fileURLToPath } from "node:url";
import { writeManifest } from "../plugins/content-core.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifest = await writeManifest(
  path.join(root, "digital-garden"),
  path.join(root, "src/generated/manifest.json"),
);
console.log(`gen-content: ${manifest.notes.length} notes, ${manifest.groups.length} groups`);
