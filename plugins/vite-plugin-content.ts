import path from "node:path";
import type { Plugin } from "vite";
// Logic lives in plain JS so the same code powers the build prestep + CI.
import { writeContent } from "./content-core.mjs";

/**
 * Scans digital-garden/ into src/generated/{manifest,layouts}.json on server
 * start and rebuilds both (with a full page reload) whenever a note changes.
 */
export default function contentPlugin(): Plugin {
  let gardenDir = "";
  let outDir = "";

  return {
    name: "vite-plugin-content",
    async configResolved(config) {
      gardenDir = path.resolve(config.root, "digital-garden");
      outDir = path.resolve(config.root, "src/generated");
      await writeContent(gardenDir, outDir);
    },
    configureServer(server) {
      server.watcher.add(gardenDir);
      const onChange = async (file: string) => {
        if (!file.startsWith(gardenDir)) return;
        try {
          await writeContent(gardenDir, outDir);
          server.ws.send({ type: "full-reload" });
          server.config.logger.info("  content manifest + graph layouts rebuilt");
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
