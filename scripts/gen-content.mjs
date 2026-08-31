// Generate src/generated/{manifest,layouts}.json before typechecking/building,
// so `tsc` can resolve the JSON imports on a fresh checkout (the Vite plugin
// regenerates them during dev and build too).
import path from "node:path";
import { fileURLToPath } from "node:url";
import { writeContent } from "../plugins/content-core.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { manifest, layouts } = await writeContent(
  path.join(root, "digital-garden"),
  path.join(root, "src/generated"),
);
console.log(
  `gen-content: ${manifest.notes.length} notes, ${manifest.groups.length} groups, ` +
    `${Object.keys(layouts.notes).length + 1} pre-baked graph layouts`,
);
