import path from "node:path";
import type { Plugin } from "vite";
// Logic lives in plain JS so the same code powers the build prestep + CI.
import { writeManifest } from "./content-core.mjs";

/**
 * Scans digital-garden/ into src/generated/manifest.json on server start and rebuilds it
 * (with a full page reload) whenever a note changes.
 */
export default function contentPlugin(): Plugin {
  let gardenDir = "";
  let outFile = "";

  return {
    name: "vite-plugin-content",
    async configResolved(config) {
      gardenDir = path.resolve(config.root, "digital-garden");
      outFile = path.resolve(config.root, "src/generated/manifest.json");
      await writeManifest(gardenDir, outFile);
    },
    configureServer(server) {
      server.watcher.add(gardenDir);
      const onChange = async (file: string) => {
        if (!file.startsWith(gardenDir)) return;
        try {
          await writeManifest(gardenDir, outFile);
          server.ws.send({ type: "full-reload" });
          server.config.logger.info("  content manifest rebuilt");
        } catch (err) {
          server.config.logger.error(String(err));
        }
      };
      server.watcher.on("add", onChange);
      server.watcher.on("change", onChange);
      server.watcher.on("unlink", onChange);
    },
  };
}
